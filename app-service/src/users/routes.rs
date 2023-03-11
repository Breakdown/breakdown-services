use crate::utils::auth::create_session_auth_layer;
use axum::{
    middleware,
    routing::{get, patch, post},
    Router,
};

use super::service::{
    get_me, get_user_bills, get_user_following_bills, get_user_issues, patch_user,
    post_user_follow_bill, post_user_location, post_user_seen_bill,
};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/me", get(get_me))
        .route("/feed", get(get_user_bills))
        .route("/issues", get(get_user_issues))
        .route("/location", post(post_user_location))
        .route("/bills/:bill_id/seen", post(post_user_seen_bill))
        .route("/bills/:bill_id/following", post(post_user_follow_bill))
        .route("/bills/following", get(get_user_following_bills))
        .route("/", patch(patch_user))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/users", service_router)
}
