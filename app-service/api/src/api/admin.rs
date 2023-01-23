use axum::{routing::put, Router};

use crate::services::admin::put_issue_image;

pub fn router() -> Router {
    let service_router = Router::new().route("/issues/:id/image", put(put_issue_image));
    Router::new().nest("/admin", service_router)
}
