use axum::{routing::post, Router};

use crate::services::auth::{signin, signout, signup};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/signin", post(signin))
        .route("/signup", post(signup))
        .route("/signout", post(signout));
    Router::new().nest("/auth", service_router)
}
