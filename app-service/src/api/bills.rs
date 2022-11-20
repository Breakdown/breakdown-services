use axum::{routing::get, Router};

use crate::services::bills::{get_bill_by_id, get_bills};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/:id", get(get_bill_by_id))
        .route("/", get(get_bills));
    Router::new().nest("/bills", service_router)
}
