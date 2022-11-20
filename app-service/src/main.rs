#![allow(dead_code)]
use app_service::api::bills;
use app_service::api::health;
use app_service::api::reps;
use app_service::api::sync;
use app_service::api::ApiContext;
use app_service::config::Config;
use app_service::telemetry::{get_subscriber, init_subscriber};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Extension;
use axum::Router;
use envconfig::Envconfig;
use sqlx::postgres::PgConnectOptions;
use sqlx::postgres::PgPoolOptions;
use sqlx::ConnectOptions;
use std::net::SocketAddr;
use std::str::FromStr;
use std::sync::Arc;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let subscriber = get_subscriber("app-service".into(), "info".into(), std::io::stdout);
    init_subscriber(subscriber);

    let config = Config::init_from_env().unwrap();

    // TODO: Make the statement logging dependent on an environment variable
    let options = PgConnectOptions::from_str(&config.DATABASE_URL.as_str())
        .unwrap()
        .disable_statement_logging()
        .clone();
    let connection_pool = PgPoolOptions::new()
        .max_connections(config.DB_MAX_CONNECTIONS.parse::<u32>().unwrap())
        .connect_with(options)
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
    health::router()
        .merge(sync::router())
        .merge(bills::router())
        .merge(reps::router())
}

async fn fallback_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "Not Found")
}
