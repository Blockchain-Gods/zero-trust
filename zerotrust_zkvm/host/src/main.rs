use methods::GUEST_ZEROTRUST_ZKVM_ID;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer, Result};
use dashmap::DashMap;
use hex::encode as hex_encode;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Instant;
use uuid::Uuid;

use host::{
    digest_to_bytes, fetch_bot_config_from_stellar, prove_game, ActionEntry, ProveInput,
};

// ─── Job state ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "status")]
enum JobState {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "proving")]
    Proving,
    #[serde(rename = "done")]
    Done { result: ProveResponse },
    #[serde(rename = "failed")]
    Failed { error: String },
}

type JobStore = Arc<DashMap<String, JobState>>;

// ─── Request / Response types ─────────────────────────────────────────────────

#[derive(Debug, Deserialize, Clone)]
struct ProveRequest {
    challenge_id: String,
    player_pubkey: String,
    bot_config_id: u32,
    action_log: Vec<ActionEntry>,
}

#[derive(Debug, Clone, Serialize)]
struct ProveResponse {
    success: bool,
    proof_verified: bool,
    execution_time_ms: u128,

    #[serde(skip_serializing_if = "Option::is_none")]
    seal_hex: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    image_id_hex: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    journal_sha256_hex: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    journal_bytes_hex: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    journal: Option<JournalResponse>,

    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct JournalResponse {
    challenge_id: String,
    player_pubkey: String,
    bot_config_id: u32,
    threats_cured: u32,
    systems_destroyed: u32,
    data_leaked_x100: u32,
    score: u32,
    duration_ms: u32,
    accuracy_bps: u32,
}

#[derive(Debug, Serialize)]
struct SubmitResponse {
    job_id: String,
}

#[derive(Debug, Serialize)]
struct StatusResponse {
    job_id: String,
    #[serde(flatten)]
    state: JobState,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    image_id_hex: String,
    version: String,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn image_id_hex() -> String {
    hex_encode(digest_to_bytes(GUEST_ZEROTRUST_ZKVM_ID.into()))
}

fn parse_hex_32(s: &str) -> anyhow::Result<[u8; 32]> {
    let bytes = hex::decode(s.trim_start_matches("0x"))?;
    if bytes.len() != 32 {
        anyhow::bail!("expected 32-byte hex, got {} bytes", bytes.len());
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&bytes);
    Ok(out)
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

async fn health() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(HealthResponse {
        status: "healthy".to_string(),
        image_id_hex: image_id_hex(),
        version: "1.0.0".to_string(),
    }))
}

async fn get_image_id() -> Result<HttpResponse> {
    #[derive(Serialize)]
    struct Resp {
        image_id_hex: String,
    }
    Ok(HttpResponse::Ok().json(Resp {
        image_id_hex: image_id_hex(),
    }))
}

/// POST /prove
/// Validates input, fetches bot config, spawns proving task, returns job_id immediately.
async fn submit_prove(
    jobs: web::Data<JobStore>,
    req: web::Json<ProveRequest>,
) -> Result<HttpResponse> {
    let req = req.into_inner();

    // ── Validate player_pubkey ────────────────────────────────────────────────
    let player_pubkey = match parse_hex_32(&req.player_pubkey) {
        Ok(k) => k,
        Err(e) => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "error": format!("invalid player_pubkey: {}", e)
            })))
        }
    };

    // ── Validate challenge_id ─────────────────────────────────────────────────
    let challenge_id_bytes = match parse_hex_32(&req.challenge_id) {
        Ok(b) => b,
        Err(e) => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "error": format!("invalid challenge_id: {}", e)
            })))
        }
    };
    let challenge_id = u32::from_le_bytes(challenge_id_bytes[..4].try_into().unwrap());

    // ── Validate action log ───────────────────────────────────────────────────
    if req.action_log.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "action_log must not be empty"
        })));
    }
    for (i, entry) in req.action_log.iter().enumerate() {
        if entry.unassigned_at_ms <= entry.assigned_at_ms {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "error": format!(
                    "action_log[{}]: unassigned_at_ms ({}) must be > assigned_at_ms ({})",
                    i, entry.unassigned_at_ms, entry.assigned_at_ms
                )
            })));
        }
    }

    // ── Fetch bot config from Stellar (async, before spawning) ────────────────
    let bot_config = match fetch_bot_config_from_stellar(req.bot_config_id).await {
        Ok(cfg) => cfg,
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("failed to fetch bot config (token_id={}): {}", req.bot_config_id, e)
            })))
        }
    };

    // ── Create job ────────────────────────────────────────────────────────────
    let job_id = Uuid::new_v4().to_string();
    jobs.insert(job_id.clone(), JobState::Pending);

    log::info!("Job {} created for bot_config_id={}", job_id, req.bot_config_id);

    // ── Spawn blocking prove task ─────────────────────────────────────────────
    let jobs_clone = jobs.clone();
    let job_id_clone = job_id.clone();

    actix_web::rt::spawn(async move {
        jobs_clone.insert(job_id_clone.clone(), JobState::Proving);

        let input = ProveInput {
            challenge_id,
            player_pubkey,
            bot_config_id: req.bot_config_id,
            bot_config,
            action_log: req.action_log.clone(),
        };

        let start = Instant::now();

        let result = actix_web::web::block(move || prove_game(&input)).await;

        match result {
            Ok(Ok(prove_result)) => {
                let elapsed = start.elapsed().as_millis();
                let j = &prove_result.journal;

                let response = ProveResponse {
                    success: true,
                    proof_verified: true,
                    execution_time_ms: elapsed,
                    seal_hex: Some(format!("0x{}", hex_encode(&prove_result.seal))),
                    image_id_hex: Some(hex_encode(prove_result.image_id)),
                    journal_sha256_hex: Some(hex_encode(prove_result.journal_sha256)),
                    journal_bytes_hex: Some(format!(
                        "0x{}",
                        hex_encode(&prove_result.journal_bytes)
                    )),
                    journal: Some(JournalResponse {
                        challenge_id: hex_encode(&prove_result.journal_bytes[0..4]),
                        player_pubkey: hex_encode(j.player_pubkey),
                        bot_config_id: j.bot_config_id,
                        threats_cured: j.threats_cured,
                        systems_destroyed: j.systems_destroyed,
                        data_leaked_x100: j.data_leaked_x100,
                        score: j.score,
                        duration_ms: j.duration_ms,
                        accuracy_bps: j.accuracy_bps,
                    }),
                    error: None,
                };

                log::info!("Job {} done in {}ms", job_id_clone, elapsed);
                jobs_clone.insert(job_id_clone, JobState::Done { result: response });
            }
            Ok(Err(e)) => {
                log::error!("Job {} failed: {}", job_id_clone, e);
                jobs_clone.insert(
                    job_id_clone,
                    JobState::Failed {
                        error: format!("proof generation failed: {}", e),
                    },
                );
            }
            Err(e) => {
                log::error!("Job {} thread pool error: {}", job_id_clone, e);
                jobs_clone.insert(
                    job_id_clone,
                    JobState::Failed {
                        error: format!("thread pool error: {}", e),
                    },
                );
            }
        }
    });

    // ── Return job_id immediately ─────────────────────────────────────────────
    Ok(HttpResponse::Accepted().json(SubmitResponse { job_id }))
}

/// GET /status/{job_id}
async fn job_status(
    jobs: web::Data<JobStore>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let job_id = path.into_inner();

    match jobs.get(&job_id) {
        Some(state) => Ok(HttpResponse::Ok().json(StatusResponse {
            job_id,
            state: state.clone(),
        })),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("job {} not found", job_id)
        }))),
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    println!("Zero Trust — RISC Zero Host");
    println!("Image ID: {}", image_id_hex());

    let jobs: JobStore = Arc::new(DashMap::new());

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(Logger::default())
            .wrap(cors)
            .app_data(web::Data::new(jobs.clone()))
            .route("/health", web::get().to(health))
            .route("/image-id", web::get().to(get_image_id))
            .route("/prove", web::post().to(submit_prove))
            .route("/status/{job_id}", web::get().to(job_status))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}