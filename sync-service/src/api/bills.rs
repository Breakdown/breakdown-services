use axum::{routing::get, Router};

use crate::services::bills::get_bill_by_id;

pub fn router() -> Router {
    let service_router = Router::new().route("/:id", get(get_bill_by_id));
    Router::new().nest("/bills", service_router)
}

// basic handler that responds with a static string
