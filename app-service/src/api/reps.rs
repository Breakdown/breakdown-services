use axum::{routing::get, Router};

use crate::services::reps::{get_rep_by_id, get_reps};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/", get(get_reps))
        .route("/:id", get(get_rep_by_id));
    Router::new().nest("/reps", service_router)
}
