use crate::config::Config;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct ApiContext {
    pub config: Arc<Config>,
    pub connection_pool: PgPool,
}

pub mod bills;
pub mod health;
pub mod reps;
pub mod sync;