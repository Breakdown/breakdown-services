use std::{str::FromStr, sync::Arc};

use crate::{config::Config, utils::api_error::ApiError};
use envconfig::Envconfig;
use sqlx::{
    postgres::{PgConnectOptions, PgPoolOptions},
    ConnectOptions,
};
use tokio_cron_scheduler::{Job, JobScheduler};

use super::sync::sync_bills;

pub async fn schedule_bill_sync() -> Result<(), ApiError> {
    // Create the scheduler
    let mut scheduler = match JobScheduler::new().await {
        Ok(scheduler) => scheduler,
        Err(e) => {
            println!("Could not create scheduler: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    // Define the job
    // Scheduled daily at midnight
    let job = match Job::new_async("0 0 * * * *", |_uuid, _l| {
        Box::pin(async {
            let config = Arc::new(Config::init_from_env().unwrap());
            let options = PgConnectOptions::from_str(&config.DATABASE_URL.as_str())
                .unwrap()
                .disable_statement_logging()
                .clone();
            let connection_pool = PgPoolOptions::new()
                .max_connections(config.DB_MAX_CONNECTIONS.parse::<u32>().unwrap())
                .connect_with(options)
                .await
                .expect("Could not connect to database");
            match sync_bills(&connection_pool, &config).await {
                Ok(_) => println!("Synced bills"),
                Err(e) => println!("Could not sync bills: {}", e),
            };
        })
    }) {
        Ok(job) => job,
        Err(e) => {
            println!("Could not create bills sync job: {}", e);
            return Err(ApiError::InternalError);
        }
    };
    // Add the job
    match scheduler.add(job).await {
        Ok(_) => println!("Added bills sync job to scheduler"),
        Err(e) => {
            println!("Could not add bills sync job to scheduler: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    #[cfg(feature = "signal")]
    scheduler.shutdown_on_ctrl_c();

    scheduler.set_shutdown_handler(Box::new(|| {
        Box::pin(async move {
            println!("Shut down done");
        })
    }));

    // Start the scheduler
    match scheduler.start().await {
        Ok(_) => println!("Started scheduler"),
        Err(e) => {
            println!("Could not start scheduler: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    Ok(())
}
