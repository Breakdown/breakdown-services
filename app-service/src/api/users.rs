use crate::{
    services::users::{get_me, resend_sms, verify_sms},
    utils::auth::create_session_auth_layer,
};
use axum::{
    middleware,
    routing::{get, post},
    Router,
};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/verify-sms", post(verify_sms))
        .route("/resend-sms", post(resend_sms))
        .route("/me", get(get_me))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/users", service_router)
}
