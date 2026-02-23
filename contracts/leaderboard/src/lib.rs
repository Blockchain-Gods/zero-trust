#![no_std]

use core::cmp::Ordering;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Bytes, BytesN,
    Env, IntoVal, InvokeError, String, Symbol, Val, Vec,
};

const TOP_N: u32 = 20;
const MIN_NAME_LEN: u32 = 1;
const MAX_NAME_LEN: u32 = 24;
const ASCII_PRINTABLE_MIN: u8 = 0x20;
const ASCII_PRINTABLE_MAX: u8 = 0x7E;

#[contract]
pub struct Leaderboard;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScoreEntry {
    pub score: u32,
    pub threats_cured: u32,
    pub accuracy_bps: u32,
    pub duration_ms: u32,
    pub bot_id: u32,
    pub name: String,
    pub submitted_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LeaderboardRow {
    pub player: Address,
    pub name: String,
    pub score: u32,
    pub threats_cured: u32,
    pub accuracy_bps: u32,
    pub bot_id: u32,
}

#[contracttype]
enum DataKey {
    Admin,
    VerifierId,
    ImageId,
    Best(Address), // global best per player, no challenge_id
    Top,           // single global top list
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidName = 3,
    InvalidImageId = 4,
    ProofVerificationFailed = 5,
}

fn require_admin(env: &Env) -> Address {
    let admin = read_admin(env);
    admin.require_auth();
    admin
}

fn read_admin(env: &Env) -> Address {
    env.storage()
        .persistent()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
}

fn read_image_id(env: &Env) -> BytesN<32> {
    env.storage()
        .persistent()
        .get(&DataKey::ImageId)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
}

fn read_verifier_id(env: &Env) -> Address {
    env.storage()
        .persistent()
        .get(&DataKey::VerifierId)
        .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
}

fn validate_name(env: &Env, name: &String) {
    let len = name.len();
    if len < MIN_NAME_LEN || len > MAX_NAME_LEN {
        panic_with_error!(env, Error::InvalidName);
    }
    let mut buf = [0u8; MAX_NAME_LEN as usize];
    name.copy_into_slice(&mut buf[..len as usize]);
    for b in buf[..len as usize].iter() {
        if *b < ASCII_PRINTABLE_MIN || *b > ASCII_PRINTABLE_MAX {
            panic_with_error!(env, Error::InvalidName);
        }
    }
}

fn verify_proof(
    env: &Env,
    verifier_id: &Address,
    journal_hash: &BytesN<32>,
    image_id: &BytesN<32>,
    seal: &Bytes,
) {
    let mut args: Vec<Val> = Vec::new(env);
    args.push_back(seal.into_val(env));
    args.push_back(image_id.into_val(env));
    args.push_back(journal_hash.into_val(env));

    let result =
        env.try_invoke_contract::<Val, InvokeError>(verifier_id, &Symbol::new(env, "verify"), args);
    match result {
        Ok(Ok(_)) => {}
        Ok(Err(_)) | Err(_) => panic_with_error!(env, Error::ProofVerificationFailed),
    }
}

fn cmp_rows(a: &LeaderboardRow, b: &LeaderboardRow) -> Ordering {
    if a.score > b.score {
        Ordering::Less
    } else if a.score < b.score {
        Ordering::Greater
    } else {
        a.player.cmp(&b.player)
    }
}

fn sort_rows(rows: &mut Vec<LeaderboardRow>) {
    let len = rows.len();
    let mut i = 0u32;
    while i < len {
        let mut best = i;
        let mut j = i + 1;
        while j < len {
            let candidate = rows.get_unchecked(j);
            let current = rows.get_unchecked(best);
            if cmp_rows(&candidate, &current) == Ordering::Less {
                best = j;
            }
            j += 1;
        }
        if best != i {
            let left = rows.get_unchecked(i);
            let right = rows.get_unchecked(best);
            rows.set(i, right);
            rows.set(best, left);
        }
        i += 1;
    }
}

fn upsert_top(env: &Env, row: LeaderboardRow) {
    let storage = env.storage().persistent();
    let mut top: Vec<LeaderboardRow> = storage.get(&DataKey::Top).unwrap_or_else(|| Vec::new(env));

    let mut existing_index: Option<u32> = None;
    let mut i = 0u32;
    while i < top.len() {
        let entry = top.get_unchecked(i);
        if entry.player == row.player {
            existing_index = Some(i);
            break;
        }
        i += 1;
    }

    if let Some(idx) = existing_index {
        // Only update if new score is better
        let existing = top.get_unchecked(idx);
        if row.score > existing.score {
            top.set(idx, row);
        } else {
            return;
        }
    } else if top.len() < TOP_N {
        top.push_back(row);
    } else {
        let mut min_idx = 0u32;
        let mut min_score = top.get_unchecked(0).score;
        let mut j = 1u32;
        while j < top.len() {
            let entry = top.get_unchecked(j);
            if entry.score < min_score {
                min_score = entry.score;
                min_idx = j;
            }
            j += 1;
        }
        if row.score > min_score {
            top.set(min_idx, row);
        } else {
            return;
        }
    }

    sort_rows(&mut top);
    while top.len() > TOP_N {
        top.pop_back();
    }

    storage.set(&DataKey::Top, &top);
}

#[contractimpl]
impl Leaderboard {
    /// Deploy once: sets admin, verifier contract, and guest image_id
    pub fn init(env: Env, admin: Address, verifier_id: Address, image_id: BytesN<32>) {
        let storage = env.storage().persistent();
        if storage.has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        storage.set(&DataKey::Admin, &admin);
        storage.set(&DataKey::VerifierId, &verifier_id);
        storage.set(&DataKey::ImageId, &image_id);
    }

    /// Admin can update image_id when guest program is redeployed
    pub fn set_image_id(env: Env, image_id: BytesN<32>) {
        require_admin(&env);
        env.storage().persistent().set(&DataKey::ImageId, &image_id);
    }

    /// Submit a verified score. Proof is verified inside this call.
    pub fn submit_score(
        env: Env,
        player: Address,
        name: String,
        score: u32,
        threats_cured: u32,
        accuracy_bps: u32,
        duration_ms: u32,
        bot_id: u32,
        journal_hash: BytesN<32>,
        image_id: BytesN<32>,
        seal: Bytes,
    ) {
        player.require_auth();

        validate_name(&env, &name);

        // Verify image_id matches deployed guest
        let stored_image_id = read_image_id(&env);
        if stored_image_id != image_id {
            panic_with_error!(&env, Error::InvalidImageId);
        }

        // Verify proof — panics if invalid
        let verifier_id = read_verifier_id(&env);
        verify_proof(&env, &verifier_id, &journal_hash, &image_id, &seal);

        // Only store if better than existing best
        let best_key = DataKey::Best(player.clone());
        let best_existing: Option<ScoreEntry> = env.storage().persistent().get(&best_key);
        let should_update = match best_existing {
            None => true,
            Some(ref entry) => score > entry.score,
        };
        if !should_update {
            return;
        }

        let entry = ScoreEntry {
            score,
            threats_cured,
            accuracy_bps,
            duration_ms,
            bot_id,
            name: name.clone(),
            submitted_ledger: env.ledger().sequence(),
        };
        env.storage().persistent().set(&best_key, &entry);

        let row = LeaderboardRow {
            player,
            name,
            score,
            threats_cured,
            accuracy_bps,
            bot_id,
        };
        upsert_top(&env, row);
    }

    /// Get a player's personal best
    pub fn get_best(env: Env, player: Address) -> Option<ScoreEntry> {
        env.storage().persistent().get(&DataKey::Best(player))
    }

    /// Get global top 20
    pub fn get_top(env: Env) -> Vec<LeaderboardRow> {
        env.storage()
            .persistent()
            .get(&DataKey::Top)
            .unwrap_or_else(|| Vec::new(&env))
    }
}
