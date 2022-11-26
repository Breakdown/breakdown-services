use crate::services::auth::hash_password;
use crate::types::db::User;
use crate::utils::api_error::ApiError;
use anyhow::anyhow;
use log::log;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateUserArgs {
    pub email: Option<String>,
    pub password: Option<String>,
    pub phone: Option<String>,
}
pub async fn create_user(db_connection: &PgPool, args: CreateUserArgs) -> Result<(), ApiError> {
    if args.phone.is_some() {
        // Phone signup
        sqlx::query!(
            r#"
                INSERT INTO users (phone) VALUES ($1) RETURNING *
            "#,
            args.phone.unwrap()
        )
        .fetch_one(db_connection)
        .await
        .map_err(|e| {
            log!(log::Level::Error, "Failed to create user: {}", e);
            ApiError::Anyhow(anyhow!("Could not create user"))
        })?;
        Ok(())
    } else {
        let hashed_password = hash_password(args.password.unwrap().to_owned())
            .await
            .map_err(|_| ApiError::Anyhow(anyhow!("Error hashing password")))
            .unwrap();
        sqlx::query_as!(
            User,
            r#"
                INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *
            "#,
            args.email,
            hashed_password
        )
        .fetch_one(db_connection)
        .await
        .map_err(|_| ApiError::Anyhow(anyhow!("Could not create user")))?;
        Ok(())
    }
}
