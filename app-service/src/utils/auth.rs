use std::time::Duration;

use super::api_error::ApiError;
use crate::config::Config;
use async_redis_session::RedisSessionStore;
use axum::{http::Request, middleware::Next, response::Response};
use axum_sessions::{SessionHandle, SessionLayer};
use envconfig::Envconfig;

pub async fn create_session_layer() -> Result<SessionLayer<RedisSessionStore>, ApiError> {
    let cfg = Config::init_from_env().unwrap();
    let redis_url = format!(
        "redis://:{}@{}:{}",
        cfg.REDIS_PASSWORD, cfg.REDIS_HOST, cfg.REDIS_PORT
    );
    let store = RedisSessionStore::new(redis_url)
        .map_err(|_| anyhow::anyhow!("Could not connect to Redis"))?;
    let secret = cfg.SESSION_SECRET.as_bytes();

    // TODO: with_cookie_domain?
    Ok(
        SessionLayer::new(store, &secret)
            .with_cookie_name("bd_session")
            .with_session_ttl(Some(Duration::from_secs(60 * 60 * 24 * 30))), // 1 month
    )
}

pub async fn create_session_auth_layer<B>(
    req: Request<B>,
    next: Next<B>,
) -> Result<Response, ApiError> {
    let session_handle = req.extensions().get::<SessionHandle>().unwrap().to_owned();
    let session = session_handle.read().await;
    match session.get::<String>("user_id") {
        Some(_) => Ok(next.run(req).await),
        _ => Err(ApiError::Unauthorized),
    }
}
