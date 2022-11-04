use crate::config::Config;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct ApiContext {
    pub config: Arc<Config>,
    pub connection_pool: PgPool,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SuccessMessage {
    success: bool,
}

pub mod bills;
pub mod error;
pub mod health;
pub mod scripts;
pub mod sync;
