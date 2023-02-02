#![allow(dead_code)]
use api::config::Config;
use api::routers::{admin, auth, bills, health, issues, reps, sync, users};
use api::services::scheduling::schedule_bill_sync;
use api::utils::api_error::ApiError;
use api::utils::auth::create_session_layer;
use api::utils::ApiContext;
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
    // Tracing - need to have RUST_LOG=tower_http=trace env var set
    // let subscriber = get_subscriber("app-service".into(), "info".into(), std::io::stdout);
    // init_subscriber(subscriber);

    let config = Config::init_from_env().unwrap();
    let port = config.PORT.parse::<u16>().unwrap();

    let session_layer = create_session_layer().await.unwrap();

    // Disable sqlx default statement logging - VERY verbose
    let options = PgConnectOptions::from_str(&config.DATABASE_URL.as_str())
        .unwrap()
        .disable_statement_logging()
        .clone();
    let connection_pool = PgPoolOptions::new()
        .max_connections(config.DB_MAX_CONNECTIONS.parse::<u32>().unwrap())
        .connect_with(options)
        .await
        .expect("Could not connect to database");

    // Run migrations
    if ["dev", "production"].contains(&config.ENVIRONMENT.as_str()) {
        sqlx::migrate!("./migrations")
            .run(&connection_pool)
            .await
            .expect("Could not run migrations");
    }

    let state = ApiContext {
        config: Arc::new(config),
        connection_pool,
    };

    let app = api_router()
        .layer(Extension(state))
        .layer(TraceLayer::new_for_http())
        .layer(session_layer);

    // Schedule cron jobs
    println!("Scheduling cron jobs");
    match schedule_bill_sync().await {
        Ok(_) => println!("Scheduled bill sync"),
        Err(e) => println!("Could not schedule bill sync: {}", e),
    };

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
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
        .merge(auth::router())
        .merge(issues::router())
        .merge(users::router())
        .merge(admin::router())
}

async fn fallback_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "Not Found")
}