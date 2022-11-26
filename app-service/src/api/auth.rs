use axum::{routing::post, Router};

use crate::services::auth::{signin, signout, signup, signup_sms};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/signin", post(signin))
        .route("/signup", post(signup))
        .route("/signup-sms", post(signup_sms))
        .route("/signout", post(signout));
    Router::new().nest("/auth", service_router)
}
