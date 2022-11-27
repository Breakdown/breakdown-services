use crate::types::api::ResponseBody;
use crate::types::db::User;
use crate::utils::api_error::ApiError;
use crate::{api::ApiContext, services::auth::hash_password};
use anyhow::anyhow;
use axum::{Extension, Json};
use axum_sessions::extractors::ReadableSession;
use log::log;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn get_me(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<User>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(&ctx.connection_pool)
    .await
    .unwrap();
    Ok(Json(ResponseBody { data: user }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateUserArgs {
    pub email: Option<String>,
    pub password: Option<String>,
    pub phone: Option<String>,
}
pub async fn create_user(db_connection: &PgPool, args: CreateUserArgs) -> Result<User, ApiError> {
    if args.phone.is_some() {
        // Phone signup
        let user = sqlx::query_as!(
            User,
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
        Ok(user)
    } else {
        let hashed_password = hash_password(args.password.unwrap().to_owned())
            .await
            .map_err(|_| ApiError::Anyhow(anyhow!("Error hashing password")))
            .unwrap();
        let user = sqlx::query_as!(
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
        Ok(user)
    }
}
