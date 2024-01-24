use std::{str::FromStr, sync::Arc};

use crate::{
    config::Config,
    sync::service::{sync_bills, sync_reps},
    utils::api_error::ApiError,
};
use envconfig::Envconfig;
use sqlx::{
    postgres::{PgConnectOptions, PgPoolOptions},
    ConnectOptions, Pool, Postgres,
};
use tokio_cron_scheduler::{Job, JobScheduler};

pub struct JobConfiguration {
    pub config: Arc<Config>,
    pub connection_pool: Pool<Postgres>,
}
pub async fn get_job_configuration() -> Result<JobConfiguration, ApiError> {
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
    Ok(JobConfiguration {
        config,
        connection_pool,
    })
}

pub async fn schedule_bill_sync() -> Result<(), ApiError> {
    // Create the scheduler
    let mut scheduler = match JobScheduler::new().await {
        Ok(scheduler) => scheduler,
        Err(e) => {
            println!("Could not create scheduler for bills sync: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    // Define the job
    // Scheduled daily at midnight
    let job = match Job::new_async("0 0 * * * *", |_uuid, _l| {
        Box::pin(async {
            let job_config = get_job_configuration().await.unwrap();
            match sync_bills(&job_config.connection_pool, &job_config.config).await {
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
            println!("Bills sync shut down done");
        })
    }));

    // Start the scheduler
    match scheduler.start().await {
        Ok(_) => println!("Started bills sync scheduler"),
        Err(e) => {
            println!("Could not start bills sync scheduler: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    Ok(())
}

pub async fn schedule_rep_sync() -> Result<(), ApiError> {
    // Create the scheduler
    let mut scheduler = match JobScheduler::new().await {
        Ok(scheduler) => scheduler,
        Err(e) => {
            println!("Could not create scheduler for reps sync: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    // Define the job
    // Scheduled weekly on Saturday at midnight
    let job = match Job::new_async("0 0 0 * 6 *", |_uuid, _l| {
        Box::pin(async {
            let job_config = get_job_configuration().await.unwrap();
            match sync_reps(&job_config.connection_pool, &job_config.config).await {
                Ok(_) => println!("Synced reps"),
                Err(e) => println!("Could not sync reps: {}", e),
            };
        })
    }) {
        Ok(job) => job,
        Err(e) => {
            println!("Could not create reps sync job: {}", e);
            return Err(ApiError::InternalError);
        }
    };
    // Add the job
    match scheduler.add(job).await {
        Ok(_) => println!("Added reps sync job to scheduler"),
        Err(e) => {
            println!("Could not add reps sync job to scheduler: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    #[cfg(feature = "signal")]
    scheduler.shutdown_on_ctrl_c();

    scheduler.set_shutdown_handler(Box::new(|| {
        Box::pin(async move {
            println!("Reps sync shut down done");
        })
    }));

    // Start the scheduler
    match scheduler.start().await {
        Ok(_) => println!("Started reps sync scheduler"),
        Err(e) => {
            println!("Could not start reps sync scheduler: {}", e);
            return Err(ApiError::InternalError);
        }
    };

    Ok(())
}
