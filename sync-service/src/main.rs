#![allow(dead_code)]
use axum::Router;
use envconfig::Envconfig;
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::net::SocketAddr;
use std::sync::Arc;
use sync_service::api::health;
use sync_service::config::Config;
use sync_service::telemetry::{get_subscriber, init_subscriber};
use tower::ServiceBuilder;
use tower_http::add_extension::AddExtensionLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
struct ApiContext {
    config: Arc<Config>,
    connection_pool: PgPool,
}

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

    let app = api_router().layer(
        ServiceBuilder::new()
            .layer(AddExtensionLayer::new(ApiContext {
                config: Arc::new(config),
                connection_pool,
            }))
            .layer(TraceLayer::new_for_http()),
    );

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
    Ok(())
}

fn api_router() -> Router {
    health::router()
}
