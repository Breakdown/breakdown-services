use axum::{routing::get, Router};

use crate::services::reps::{get_rep_by_id, get_rep_vote_on_bill, get_rep_votes, get_reps};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/", get(get_reps))
        .route("/:id", get(get_rep_by_id))
        .route("/:id/bills/:bill_id/vote", get(get_rep_vote_on_bill))
        .route("/:id/votes", get(get_rep_votes));
    Router::new().nest("/reps", service_router)
}
