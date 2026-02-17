#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

// ─── Enums matching types.ts ──────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Copy)]
pub enum BotType {
    Malware,
    Trojan,
    Ransomware,
    Worm,
    Rootkit,
    Spyware,
    Botnet,
    LogicBomb,
}

#[contracttype]
#[derive(Clone, Copy)]
pub enum SystemTargetId {
    Compute,
    Storage,
    Network,
    Auth,
    Analytics,
    Communication,
    Transaction,
    Api,
    Endpoint,
    Cdn,
    Iot,
}

#[contracttype]
#[derive(Clone, Copy)]
pub enum ResourceAttackType {
    Cpu,
    Memory,
    Bandwidth,
    Disk,
    None,
}

#[contracttype]
#[derive(Clone, Copy)]
pub enum VictoryCondition {
    TimeSurvival,
    SystemDestruction,
    DataExfiltration,
}

#[contracttype]
#[derive(Clone, Copy)]
pub enum SpecialAbility {
    Stealth,
    Mutation,
    Replication,
    Encryption,
    Persistence,
}

#[contracttype]
#[derive(Clone, Copy)]
pub enum SpawnPattern {
    Steady,
    Burst,
    Crescendo,
}

#[contracttype]
#[derive(Clone, Copy)]
pub enum SkillDiversity {
    Low,
    Medium,
    High,
}

// ─── Bot Configuration ────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct BotConfig {
    pub version: u32,
    pub bot_name: String,
    pub bot_type: BotType,
    pub primary_target: Option<SystemTargetId>,
    pub secondary_targets: Option<Vec<SystemTargetId>>,
    pub resource_attack: ResourceAttackType,
    pub damage_multiplier: u32, // x100 (50-200 = 0.5x-2.0x)
    pub victory_condition: VictoryCondition,
    pub abilities: Vec<SpecialAbility>,
    pub threat_count: u32,
    pub spawn_pattern: SpawnPattern,
    pub skill_diversity: SkillDiversity,
}

#[contracttype]
#[derive(Clone)]
pub struct BotMetadata {
    pub creator: Address,
    pub created_at: u64,
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    NextTokenId,
    Owner(u32),       // token_id -> owner address
    BotConfig(u32),   // token_id -> BotConfig
    BotMetadata(u32), // token_id -> BotMetadata
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct BotNFT;

#[contractimpl]
impl BotNFT {
    /// Initialize contract
    pub fn initialize(env: Env) {
        env.storage().instance().set(&DataKey::NextTokenId, &1u32);
    }

    /// Deploy a bot - mints NFT
    pub fn deploy_bot(env: Env, owner: Address, bot_config: BotConfig) -> u32 {
        owner.require_auth();

        // Validate
        Self::validate_bot_config(&bot_config);

        // Get next token ID
        let token_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1);

        // Store owner
        env.storage()
            .persistent()
            .set(&DataKey::Owner(token_id), &owner);

        // Store bot config
        env.storage()
            .persistent()
            .set(&DataKey::BotConfig(token_id), &bot_config);

        // Store metadata
        let metadata = BotMetadata {
            creator: owner,
            created_at: env.ledger().timestamp(),
        };
        env.storage()
            .persistent()
            .set(&DataKey::BotMetadata(token_id), &metadata);

        // Increment counter
        env.storage()
            .instance()
            .set(&DataKey::NextTokenId, &(token_id + 1));

        // Extend TTL
        let ttl = 17280_u32; // ~30 days
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Owner(token_id), ttl, ttl);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::BotConfig(token_id), ttl, ttl);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::BotMetadata(token_id), ttl, ttl);

        token_id
    }

    /// Get bot config
    pub fn get_bot_config(env: Env, token_id: u32) -> BotConfig {
        env.storage()
            .persistent()
            .get(&DataKey::BotConfig(token_id))
            .unwrap()
    }

    /// Get bot metadata
    pub fn get_bot_metadata(env: Env, token_id: u32) -> BotMetadata {
        env.storage()
            .persistent()
            .get(&DataKey::BotMetadata(token_id))
            .unwrap()
    }

    /// Get owner
    pub fn owner_of(env: Env, token_id: u32) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .unwrap()
    }

    /// Transfer ownership
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u32) {
        from.require_auth();

        let current_owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .unwrap();

        if current_owner != from {
            panic!("not owner");
        }

        env.storage()
            .persistent()
            .set(&DataKey::Owner(token_id), &to);
    }

    /// Validation
    fn validate_bot_config(config: &BotConfig) {
        assert!(config.version == 1, "version must be 1");
        assert!(config.abilities.len() <= 5, "max 5 abilities");

        if let Some(ref targets) = config.secondary_targets {
            assert!(targets.len() <= 3, "max 3 secondary targets");
        }

        assert!(
            config.damage_multiplier >= 50 && config.damage_multiplier <= 200,
            "damage multiplier must be 50-200"
        );

        assert!(
            config.threat_count >= 3 && config.threat_count <= 8,
            "threat count must be 3-8"
        );
    }
}
