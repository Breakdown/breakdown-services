use super::service::{follow_issue, get_issue_bills, get_issue_by_id, get_issues, unfollow_issue};
use crate::utils::auth::create_session_auth_layer;
use axum::{
    middleware,
    routing::{get, post},
    Router,
};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/", get(get_issues))
        .route("/:id", get(get_issue_by_id))
        .route("/:id/follow", post(follow_issue))
        .route("/:id/unfollow", post(unfollow_issue))
        .route("/:id/bills", get(get_issue_bills))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/issues", service_router)
}
