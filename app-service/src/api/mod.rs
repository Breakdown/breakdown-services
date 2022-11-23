use crate::config::Config;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone, Debug)]
pub struct ApiContext {
    pub config: Arc<Config>,
    pub connection_pool: PgPool,
}

pub mod auth;
pub mod bills;
pub mod health;
pub mod issues;
pub mod reps;
pub mod sync;
pub mod users;
