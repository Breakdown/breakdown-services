use anyhow::anyhow;
use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHash};
use sqlx::PgPool;

use crate::types::db::User;
use crate::utils::api_error::ApiError;

async fn hash_password(password: String) -> Result<String, ApiError> {
    // Argon2 hashing is designed to be computationally intensive,
    // so we need to do this on a blocking thread.
    let result = tokio::task::spawn_blocking(move || -> Result<String, ApiError> {
        let salt = SaltString::generate(rand::thread_rng());
        Ok(
            PasswordHash::generate(Argon2::default(), password, salt.as_str())
                .map_err(|e| anyhow::anyhow!("Failed to generate password hash: {}", e))?
                .to_string(),
        )
    })
    .await
    .unwrap();
    match result {
        Ok(hash) => Ok(hash),
        Err(e) => Err(ApiError::Anyhow(anyhow!("Failed to hash password: {}", e))),
    }
}

pub async fn create_user(
    db_connection: &PgPool,
    email: &str,
    password: &str,
) -> Result<(), ApiError> {
    let hashed_password = hash_password(password.to_owned())
        .await
        .map_err(|e| ApiError::Anyhow(anyhow!("Error hashing password")))
        .unwrap();
    println!("hashed_password: {}", hashed_password);
    let result = sqlx::query_as!(
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
    println!("{:#?}", result);
    Ok(())
}
