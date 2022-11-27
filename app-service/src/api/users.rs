use crate::{services::users::get_me, utils::auth::create_session_auth_layer};
use axum::{
    middleware,
    routing::{get, post},
    Router,
};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/me", get(get_me))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/users", service_router)
}
