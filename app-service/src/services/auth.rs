use crate::{api::ApiContext, types::db::User, utils::api_error::ApiError};
use anyhow::anyhow;
use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::users::create_user;

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginRequestBody {
    pub email: String,
    pub password: String,
}

pub async fn login(
    ctx: Extension<ApiContext>,
    Json(body): Json<LoginRequestBody>,
) -> Result<Json<HashMap<String, String>>, ApiError> {
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

    println!("{:#?}", user);
    todo!()
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SignupRequestBody {
    pub email: String,
    pub password: String,
}

pub async fn signup(
    ctx: Extension<ApiContext>,
    Json(body): Json<SignupRequestBody>,
) -> Result<Json<HashMap<String, String>>, ApiError> {
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

    todo!()
}
