use super::service::{resend_sms, signin, signin_sms, signout, signup, signup_sms, verify_sms};
use axum::{routing::post, Router};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/signin", post(signin))
        .route("/signup", post(signup))
        .route("/signin-sms", post(signin_sms))
        .route("/signup-sms", post(signup_sms))
        .route("/verify-sms", post(verify_sms))
        .route("/resend-sms", post(resend_sms))
        .route("/signout", post(signout));
    Router::new().nest("/auth", service_router)
}
