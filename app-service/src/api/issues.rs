use axum::{routing::get, Router};

use crate::services::issues::{get_issue_by_id, get_issues};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/", get(get_issues))
        .route("/:id", get(get_issue_by_id));
    Router::new().nest("/issues", service_router)
}
