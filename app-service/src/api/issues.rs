use axum::{
    middleware,
    routing::{get, post},
    Router,
};

use crate::{
    services::issues::{follow_issue, get_issue_by_id, get_issues},
    utils::auth::create_session_auth_layer,
};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/", get(get_issues))
        .route("/:id", get(get_issue_by_id))
        .route("/:id/follow", post(follow_issue))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/issues", service_router)
}
