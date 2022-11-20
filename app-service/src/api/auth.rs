use axum::{routing::post, Router};

use crate::services::auth::login;

pub fn router() -> Router {
    let service_router = Router::new().route("/login", post(login));
    Router::new().nest("/auth", service_router)
}
