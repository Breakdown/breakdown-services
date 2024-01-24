use super::service::{get_bill_by_id, get_bill_cosponsors, get_bill_sponsor, get_bills};
use crate::utils::auth::create_session_auth_layer;
use axum::{middleware, routing::get, Router};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/:id", get(get_bill_by_id))
        .route("/", get(get_bills))
        .route("/:id/sponsor", get(get_bill_sponsor))
        .route("/:id/cosponsors", get(get_bill_cosponsors))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/bills", service_router)
}
