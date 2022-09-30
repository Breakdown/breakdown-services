#![allow(dead_code)]
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Extension;
use axum::Router;
use envconfig::Envconfig;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use std::sync::Arc;
use sync_service::api::bills;
use sync_service::api::health;
use sync_service::api::ApiContext;
use sync_service::config::Config;
use sync_service::telemetry::{get_subscriber, init_subscriber};
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let subscriber = get_subscriber("sync-service".into(), "info".into(), std::io::stdout);
    init_subscriber(subscriber);

    let config = Config::init_from_env().unwrap();
    let connection_pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(&config.DATABASE_URI)
        .await
        .expect("Could not connect to database");

    let state = ApiContext {
        config: Arc::new(config),
        connection_pool,
    };

    let app = api_router()
        .layer(Extension(state))
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
    Ok(())
}

fn api_router() -> Router {
    health::router().merge(bills::router())
}

async fn fallback_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "Not Found")
}
