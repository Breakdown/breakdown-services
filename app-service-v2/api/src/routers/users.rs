use crate::{
    services::users::{get_me, get_user_bills, patch_user},
    utils::auth::create_session_auth_layer,
};
use axum::{
    middleware,
    routing::{get, patch},
    Router,
};

pub fn router() -> Router {
    let service_router = Router::new()
        // .route("/me", get(get_me))
        // .route("/feed", get(get_user_bills))
        // .route("/", patch(patch_user))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/users", service_router)
}
