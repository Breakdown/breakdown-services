use super::users::create_user;
use crate::types::api::ResponseBody;
use crate::{api::ApiContext, types::db::User, utils::api_error::ApiError};
use anyhow::anyhow;
use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHash};
use axum::{Extension, Json};
use axum_sessions::extractors::WritableSession;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub async fn hash_password(password: String) -> Result<String, ApiError> {
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

async fn verify_password(password: String, password_hash: String) -> Result<bool, ApiError> {
    let result = tokio::task::spawn_blocking(move || -> Result<(), ApiError> {
        let hash = PasswordHash::new(&password_hash)
            .map_err(|e| anyhow::anyhow!("invalid password hash: {}", e))?;

        Ok(hash
            .verify_password(&[&Argon2::default()], password)
            .map_err(|e| match e {
                argon2::password_hash::Error::Password => ApiError::Unauthorized,
                _ => anyhow::anyhow!("Failed to verify password hash: {}", e).into(),
            })
            .unwrap())
    })
    .await
    .unwrap();
    match result {
        Ok(_) => Ok(true),
        Err(e) => Err(ApiError::Anyhow(anyhow!("Failed to hash password: {}", e))),
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginRequestBody {
    pub email: String,
    pub password: String,
}
pub async fn login(
    ctx: Extension<ApiContext>,
    Json(body): Json<LoginRequestBody>,
    mut session: WritableSession,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let user = sqlx::query_as!(
        User,
        r#"
          SELECT * FROM users WHERE email = $1
        "#,
        body.email
    )
    .fetch_one(&ctx.connection_pool)
    .await
    .map_err(|_| return ApiError::NotFound)?;

    verify_password(body.password, user.password).await?;

    session
        .insert("user_id", user.id.to_string())
        .map_err(|e| ApiError::Anyhow(anyhow!("Failed to insert user_id into session: {}", e)));

    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SignupRequestBody {
    pub email: String,
    pub password: String,
}
pub async fn signup(
    ctx: Extension<ApiContext>,
    Json(body): Json<SignupRequestBody>,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let email_exists = sqlx::query_as!(
        User,
        r#"
          SELECT * FROM users WHERE email = $1
        "#,
        body.email
    )
    .fetch_one(&ctx.connection_pool)
    .await
    .is_ok();

    // Guard clauses
    if email_exists {
        return Err(ApiError::Anyhow(anyhow!("User already exists")));
    }

    create_user(&ctx.connection_pool, &body.email, &body.password).await?;

    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}

pub async fn signout(mut session: WritableSession) -> Result<Json<ResponseBody<String>>, ApiError> {
    session.destroy();

    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}
