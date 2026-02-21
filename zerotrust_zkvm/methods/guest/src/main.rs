#![no_main]
risc0_zkvm::guest::entry!(main);

use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};

// ─── Must match host/src/lib.rs exactly ──────────────────────────────────────

const JOURNAL_LEN: usize = 64;
const ROUND_DURATION_MS: u32 = 90_000;
const BASE_DAMAGE_RATE: u32 = 12; // 1.2 per tick × 10 (tick = 100ms) → 12 per second × 10
const BASE_CURE_RATES: [u32; 4] = [30, 20, 10, 5]; // perfect/good/partial/poor × 10
const TICK_MS: u32 = 100;

// Skill pool — must match SKILL_POOL order in game-logic.ts exactly
const SKILL_POOL: [&str; 9] = [
    "python",
    "rust",
    "javascript",
    "network",
    "endpoint",
    "crypto",
    "database",
    "web",
    "forensics",
];

// Fixed developer pool — must match FIXED_DEVELOPER_POOL in game-logic.ts exactly
const DEV_SKILLS: [[usize; 3]; 10] = [
    [0, 3, 5], // Alice:   python, network, crypto
    [1, 4, 6], // Bob:     rust, endpoint, database
    [2, 7, 8], // Charlie: javascript, web, forensics
    [5, 0, 8], // Diana:   crypto, python, forensics
    [3, 4, 7], // Eve:     network, endpoint, web
    [6, 1, 0], // Frank:   database, rust, python
    [7, 2, 6], // Grace:   web, javascript, database
    [8, 3, 1], // Hiro:    forensics, network, rust
    [4, 5, 2], // Iris:    endpoint, crypto, javascript
    [0, 6, 7], // Jin:     python, database, web
];

// ─── Types (must match host) ──────────────────────────────────────────────────

#[derive(Deserialize)]
struct BotConfigZK {
    bot_type: String,
    primary_target: String,
    secondary_targets: Vec<String>,
    damage_multiplier: u32, // e.g. 150 = 1.5×
    threat_count: u32,
    spawn_pattern: String,   // "steady" | "burst" | "crescendo"
    skill_diversity: String, // "low" | "medium" | "high"
    victory_condition: String,
}

#[derive(Deserialize)]
struct ActionEntry {
    dev_index: u32,
    threat_index: u32,
    assigned_at_ms: u32,
    unassigned_at_ms: u32,
}

struct Threat {
    spawn_time_ms: u32,
    required_skill_indices: Vec<usize>, // indices into SKILL_POOL
    damage_rate: u32,                   // per tick × 1000 (fixed-point)
    current_damage: u32,
    cure_progress: u32,
    assigned_dev: Option<usize>,
    is_cured: bool,
    is_failed: bool,
}

// ─── Seeded RNG — matches seedrandom behaviour ────────────────────────────────
// Simple xorshift64 seeded from the sha256 seed string bytes

struct Rng {
    state: u64,
}

impl Rng {
    fn new(seed: &str) -> Self {
        // Mix seed bytes into u64 state
        let mut state: u64 = 0x853c49e6748fea9b;
        for b in seed.bytes() {
            state ^= b as u64;
            state = state
                .wrapping_mul(0x5851f42d4c957f2d)
                .wrapping_add(0x14057b7ef767814f);
        }
        Rng { state }
    }

    // Returns value in [0, 1) as fixed-point × 1_000_000
    fn next_fp(&mut self) -> u32 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 7;
        self.state ^= self.state << 17;
        (self.state % 1_000_000) as u32
    }

    fn next_usize(&mut self, n: usize) -> usize {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 7;
        self.state ^= self.state << 17;
        (self.state as usize) % n
    }
}

// ─── Threat generation — mirrors generateThreatsFromBot ──────────────────────

fn get_spawn_interval_ms(pattern: &str) -> u32 {
    match pattern {
        "steady" => 8_000,
        "burst" => 3_000,
        "crescendo" => 12_000,
        _ => 8_000,
    }
}

fn get_skill_count(diversity: &str) -> usize {
    match diversity {
        "low" => 2,
        "medium" => 3,
        "high" => 4,
        _ => 3,
    }
}

fn generate_threats(config: &BotConfigZK, seed: &str) -> Vec<Threat> {
    let mut rng = Rng::new(seed);
    let mut threats = Vec::new();
    let interval_ms = get_spawn_interval_ms(&config.spawn_pattern);
    let skill_count = get_skill_count(&config.skill_diversity);

    for i in 0..config.threat_count as usize {
        let spawn_time_ms = if config.spawn_pattern == "crescendo" {
            // mirrors: getSpawnInterval("crescendo") * i / (1 + i * 0.15)
            // × 1000 fixed-point: interval * i * 1000 / (1000 + i * 150)
            let numer = interval_ms * i as u32;
            let denom = 1000 + i as u32 * 150;
            numer * 1000 / denom.max(1)
        } else {
            interval_ms * i as u32
        };

        // Required skills — Fisher-Yates shuffle then take first skill_count
        let mut indices: Vec<usize> = (0..SKILL_POOL.len()).collect();
        for j in (1..indices.len()).rev() {
            let k = rng.next_usize(j + 1);
            indices.swap(j, k);
        }
        let required_skill_indices = indices[..skill_count].to_vec();

        // damage_rate per tick = damageMultiplier / 100 * BASE_DAMAGE_RATE / 10
        // stored × 1000 for fixed-point: (damage_multiplier * 12) / 100
        let damage_rate = config.damage_multiplier * 12 / 100;

        threats.push(Threat {
            spawn_time_ms,
            required_skill_indices,
            damage_rate,
            current_damage: 0,
            cure_progress: 0,
            assigned_dev: None,
            is_cured: false,
            is_failed: false,
        });
    }

    threats
}

// ─── Cure speed — mirrors calculateCureSpeed ─────────────────────────────────
// Returns cure rate × 1000 per tick

fn cure_speed(threat_skills: &[usize], dev_index: usize) -> u32 {
    let dev = &DEV_SKILLS[dev_index];
    let match_count = threat_skills.iter().filter(|&&s| dev.contains(&s)).count();
    let total = threat_skills.len();
    let ratio_x3 = match_count * 3 / total; // 0, 1, 2, or 3

    // BASE_CURE_RATES: [30, 20, 10, 5] → rates × 10
    // per tick (100ms): rate / 10 / 10 = rate / 100
    // × 1000 fixed point: rate * 10
    match ratio_x3 {
        3 => 300, // 3.0 per second → 30 per tick × 10
        2 => 200, // 2.0
        1 => 100, // 1.0
        _ => 50,  // 0.5
    }
}

// ─── Score — mirrors calculateScore ──────────────────────────────────────────

fn calculate_score(
    threats_cured: u32,
    threats_total: u32,
    systems_destroyed: u32,
    duration_ms: u32,
) -> u32 {
    let accuracy_bps = threats_cured * 10_000 / threats_total.max(1);

    let baseline_ms = threats_total * 8_000;
    // timeFactor = min(2.0, baseline / duration) × 100
    let time_factor = if duration_ms == 0 {
        200u32
    } else {
        (baseline_ms * 100 / duration_ms).min(200)
    };

    let damage_penalty = systems_destroyed * 50;
    accuracy_bps
        .saturating_add(time_factor)
        .saturating_sub(damage_penalty)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

fn main() {
    // ── Read public inputs ────────────────────────────────────────────────────
    let challenge_id: u32 = env::read();
    let player_pubkey: [u8; 32] = env::read();
    let bot_config_id: u32 = env::read();
    let config: BotConfigZK = env::read();

    // ── Read private input ────────────────────────────────────────────────────
    let action_log: Vec<ActionEntry> = env::read();

    // ── Reconstruct seed — same as FE: sha256(pubkey_hex + bot_type) ─────────
    // The challenge_id passed in is already the first 4 bytes of that sha256,
    // but we need the full seed string for RNG. Reconstruct from pubkey + bot_type.
    let seed = {
        let pubkey_hex = hex_encode(&player_pubkey);
        format!("{}{}", pubkey_hex, config.bot_type)
    };

    // ── Generate threats deterministically ───────────────────────────────────
    let mut threats = generate_threats(&config, &seed);
    let total_threats = threats.len() as u32;

    // ── Validate action log ───────────────────────────────────────────────────
    // 1. All indices in bounds
    for entry in &action_log {
        assert!(
            (entry.dev_index as usize) < DEV_SKILLS.len(),
            "dev_index out of bounds"
        );
        assert!(
            (entry.threat_index as usize) < threats.len(),
            "threat_index out of bounds"
        );
        assert!(
            entry.unassigned_at_ms > entry.assigned_at_ms,
            "invalid assignment window"
        );
        assert!(
            entry.assigned_at_ms <= ROUND_DURATION_MS,
            "assignment after round end"
        );
    }

    // 2. No dev assigned to two threats simultaneously
    for i in 0..action_log.len() {
        for j in (i + 1)..action_log.len() {
            if action_log[i].dev_index == action_log[j].dev_index {
                let a = &action_log[i];
                let b = &action_log[j];
                assert!(
                    a.unassigned_at_ms <= b.assigned_at_ms
                        || b.unassigned_at_ms <= a.assigned_at_ms,
                    "dev double-assigned"
                );
            }
        }
    }

    // ── Simulate tick by tick ─────────────────────────────────────────────────
    let mut tick_ms: u32 = 0;
    let mut threats_cured: u32 = 0;
    let mut systems_destroyed: u32 = 0;
    let mut data_leaked_ticks: u32 = 0; // count of unattended failed ticks for exfil

    while tick_ms < ROUND_DURATION_MS {
        for (ti, threat) in threats.iter_mut().enumerate() {
            if threat.is_cured || threat.is_failed {
                continue;
            }
            if threat.spawn_time_ms > tick_ms {
                continue;
            }

            // Find active assignment at this tick
            let active_dev = action_log
                .iter()
                .find(|a| {
                    a.threat_index == ti as u32
                        && a.assigned_at_ms <= tick_ms
                        && a.unassigned_at_ms > tick_ms
                })
                .map(|a| a.dev_index as usize);

            threat.assigned_dev = active_dev;

            // Damage — only accumulates when no dev assigned
            if active_dev.is_none() {
                // damage_rate is already per-tick × 1000
                threat.current_damage += threat.damage_rate;
            }

            // Cure progress
            if let Some(dev) = active_dev {
                let rate = cure_speed(&threat.required_skill_indices, dev);
                threat.cure_progress += rate;
            }

            // Check outcomes (× 1000 fixed-point, 100_000 = 100%)
            if threat.cure_progress >= 100_000 {
                threat.is_cured = true;
                threats_cured += 1;
            } else if threat.current_damage >= 100_000 {
                threat.is_failed = true;
                systems_destroyed += 1;
                // Count unattended failures for data exfil
                if active_dev.is_none() {
                    data_leaked_ticks += 1;
                }
            }
        }

        tick_ms += TICK_MS;
    }

    // ── Compute final score ───────────────────────────────────────────────────
    let duration_ms = ROUND_DURATION_MS; // simplification — full round always
    let score = calculate_score(threats_cured, total_threats, systems_destroyed, duration_ms);
    let accuracy_bps = threats_cured * 10_000 / total_threats.max(1);

    // data_leaked_x100: scale to percentage × 100
    // max possible leaked ticks = total_threats, so:
    let data_leaked_x100 = (data_leaked_ticks * 10_000 / total_threats.max(1)).min(10_000);

    // ── Commit journal ────────────────────────────────────────────────────────
    // Layout must match JOURNAL_LEN = 64 and decode_journal in host/lib.rs
    let mut journal = [0u8; JOURNAL_LEN];
    let mut o = 0usize;

    macro_rules! write_u32 {
        ($v:expr) => {
            journal[o..o + 4].copy_from_slice(&($v as u32).to_le_bytes());
            o += 4;
        };
    }

    write_u32!(challenge_id);
    journal[o..o + 32].copy_from_slice(&player_pubkey);
    o += 32;
    write_u32!(bot_config_id);
    write_u32!(threats_cured);
    write_u32!(systems_destroyed);
    write_u32!(data_leaked_x100);
    write_u32!(score);
    write_u32!(duration_ms);
    write_u32!(accuracy_bps);

    env::commit_slice(&journal);
}

// ─── Hex encode (no_std compatible) ──────────────────────────────────────────

fn hex_encode(bytes: &[u8]) -> String {
    const HEX: &[u8] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(HEX[(b >> 4) as usize] as char);
        s.push(HEX[(b & 0xf) as usize] as char);
    }
    s
}
