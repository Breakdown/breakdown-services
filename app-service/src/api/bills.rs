use axum::{
    middleware,
    routing::{get, post},
    Router,
};

use crate::{
    services::bills::{
        get_bill_by_id, get_bill_cosponsors, get_bill_sponsor, get_bills, post_vote_on_bill,
    },
    utils::auth::create_session_auth_layer,
};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/:id", get(get_bill_by_id))
        .route("/", get(get_bills))
        .route("/:id/vote", post(post_vote_on_bill))
        .route("/:id/sponsor", get(get_bill_sponsor))
        .route("/:id/cosponsors", get(get_bill_cosponsors))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/bills", service_router)
}
