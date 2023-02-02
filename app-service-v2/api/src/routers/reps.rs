use axum::{routing::get, Router};

pub fn router() -> Router {
    let service_router = Router::new();
    // .route("/", get(get_reps))
    // .route("/:id", get(get_rep_by_id))
    // .route("/:id/bills/:bill_id/votes", get(get_rep_votes_on_bill))
    // .route("/:id/votes", get(get_rep_votes))
    // .route("/:id/bills/sponsored", get(get_rep_sponsored_bills))
    // .route("/:id/bills/cosponsored", get(get_rep_cosponsored_bills));
    Router::new().nest("/reps", service_router)
}
