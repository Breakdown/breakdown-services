#![allow(dead_code)]
use app_service::admin::routes as admin_routes;
use app_service::auth::routes as auth_routes;
use app_service::bills::routes as bills_routes;
use app_service::config::Config;
use app_service::issues::routes as issues_routes;
use app_service::jobs::service::schedule_bill_sync;
use app_service::reps::routes as reps_routes;
use app_service::sync::routes as sync_routes;
use app_service::telemetry::{get_subscriber, init_subscriber};
use app_service::types::api::ApiContext;
use app_service::users::routes as users_routes;
use app_service::utils::api_error::ApiError;
use app_service::utils::auth::create_session_layer;
use app_service::votes::routes as votes_routes;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Extension;
use axum::Router;
use dotenv;
use envconfig::Envconfig;
use sqlx::postgres::PgConnectOptions;
use sqlx::postgres::PgPoolOptions;
use sqlx::ConnectOptions;
use std::env;
use std::net::SocketAddr;
use std::str::FromStr;
use std::sync::Arc;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    // Tracing - need to have RUST_LOG=tower_http=trace env var set
    let subscriber = get_subscriber("app-service".into(), "info".into(), std::io::stdout);
    init_subscriber(subscriber);
    let environment = match env::var("ENVIRONMENT") {
        Ok(val) => val,
        Err(_) => "local".to_string(),
    };
    // If local, use a .env file
    if environment == "local" {
        dotenv::dotenv().ok();
    }
    // Get environment config
    let config = Config::init_from_env().unwrap();

    let port = config.PORT.parse::<u16>().unwrap();

    let session_layer = create_session_layer()
        .await
        .map_err(|_| return ApiError::InternalError)
        .unwrap();

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

fn healthcheck_router() -> Router {
    Router::new().route("/healthcheck", get(health_check))
}

// basic handler that responds with a static string
async fn health_check() -> &'static str {
    "healthy"
}

fn api_router() -> Router {
    healthcheck_router()
        .merge(sync_routes::router())
        .merge(bills_routes::router())
        .merge(reps_routes::router())
        .merge(auth_routes::router())
        .merge(issues_routes::router())
        .merge(users_routes::router())
        .merge(admin_routes::router())
        .merge(votes_routes::router())
}

async fn fallback_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "Not Found")
}
