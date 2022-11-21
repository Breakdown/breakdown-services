use crate::services::auth::hash_password;
use crate::types::db::User;
use crate::utils::api_error::ApiError;
use anyhow::anyhow;
use sqlx::PgPool;

pub async fn create_user(
    db_connection: &PgPool,
    email: &str,
    password: &str,
) -> Result<(), ApiError> {
    let hashed_password = hash_password(password.to_owned())
        .await
        .map_err(|_| ApiError::Anyhow(anyhow!("Error hashing password")))
        .unwrap();
    sqlx::query_as!(
        User,
        r#"
            INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *
        "#,
        email,
        hashed_password
    )
    .fetch_one(db_connection)
    .await
    .map_err(|_| ApiError::Anyhow(anyhow!("Could not create user")))?;
    Ok(())
}
