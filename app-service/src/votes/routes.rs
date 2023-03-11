use crate::utils::auth::create_session_auth_layer;
use axum::{
    middleware,
    routing::{get, post},
    Router,
};

use super::service::{get_user_bill_vote, get_user_votes, post_user_vote};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/", get(get_user_votes))
        .route("/:bill_id", post(post_user_vote))
        .route("/:bill_id", get(get_user_bill_vote))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/votes", service_router)
}
