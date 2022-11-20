use super::api_error::ApiError;
use crate::config::Config;
use async_redis_session::RedisSessionStore;
use axum_sessions::SessionLayer;
use envconfig::Envconfig;

pub async fn create_session_layer() -> Result<SessionLayer<RedisSessionStore>, ApiError> {
    let cfg = Config::init_from_env().unwrap();
    let redis_url = format!(
        "redis://:{}@{}:{}",
        cfg.REDIS_PASSWORD, cfg.REDIS_HOST, cfg.REDIS_PORT
    );
    let store = RedisSessionStore::new(redis_url).map_err(|e| ApiError::Unauthorized)?;
    let secret = cfg.SESSION_SECRET.as_bytes();

    Ok(SessionLayer::new(store, &secret))
}
