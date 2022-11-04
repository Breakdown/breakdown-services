use axum::{routing::get, Router};

pub fn router() -> Router {
    Router::new().route("/health_check", get(health_check))
}

// basic handler that responds with a static string
async fn health_check() -> &'static str {
    "healthy"
}
