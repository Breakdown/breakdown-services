use axum::{middleware, routing::post, Router};

use crate::utils::auth::create_session_auth_layer;

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/location", post(|| async { "Hello, World!" })) // TODO
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/users", service_router)
}
