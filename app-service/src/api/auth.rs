use axum::{routing::post, Router};

use crate::services::auth::{login, signout, signup};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/login", post(login))
        .route("/signup", post(signup))
        .route("/signout", post(signout));
    Router::new().nest("/auth", service_router)
}
