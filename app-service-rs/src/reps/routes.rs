use axum::{routing::get, Router};

use super::service::{
    get_rep_by_id, get_rep_cosponsored_bills, get_rep_sponsored_bills, get_rep_stats,
    get_rep_votes, get_rep_votes_on_bill, get_reps,
};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/", get(get_reps))
        .route("/:id", get(get_rep_by_id))
        .route("/:id/bills/:bill_id/votes", get(get_rep_votes_on_bill))
        .route("/:id/stats", get(get_rep_stats))
        .route("/:id/votes", get(get_rep_votes))
        .route("/:id/bills/sponsored", get(get_rep_sponsored_bills))
        .route("/:id/bills/cosponsored", get(get_rep_cosponsored_bills));
    Router::new().nest("/reps", service_router)
}
