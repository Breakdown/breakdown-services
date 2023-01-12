#![allow(unused_must_use)]
use super::users::{create_user, CreateUserArgs};
use crate::types::api::ResponseBody;
use crate::utils::twilio::send_sms_message;
use crate::{api::ApiContext, types::db::User, utils::api_error::ApiError};
use anyhow::anyhow;
use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHash};
use axum::{Extension, Json};
use axum_sessions::extractors::WritableSession;
use rand::Rng;
use serde::{Deserialize, Serialize};

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
pub struct SigninRequestBody {
    pub email: String,
    pub password: String,
}
pub async fn signin(
    ctx: Extension<ApiContext>,
    Json(body): Json<SigninRequestBody>,
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

    verify_password(body.password, user.password.unwrap()).await?;

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
    mut session: WritableSession,
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

    let user = create_user(
        &ctx.connection_pool,
        CreateUserArgs {
            email: Some(body.email),
            password: Some(body.password),
            phone: None,
        },
    )
    .await?;

    session
        .insert("user_id", user.id.to_string())
        .map_err(|e| ApiError::Anyhow(anyhow!("Failed to insert user_id into session: {}", e)));

    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SignupSMSRequestBody {
    pub phone: String,
}
pub async fn signup_sms(
    ctx: Extension<ApiContext>,
    Json(body): Json<SignupSMSRequestBody>,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let phone_number = body.phone.to_string().to_owned();
    if body.phone.len() == 0 {
        return Err(ApiError::Anyhow(anyhow!("Phone number is required")));
    }
    let phone_exists = sqlx::query_as!(
        User,
        r#"
          SELECT * FROM users WHERE phone = $1
        "#,
        body.phone
    )
    .fetch_one(&ctx.connection_pool)
    .await
    .is_ok();

    // Guard clauses
    if phone_exists {
        return Err(ApiError::Anyhow(anyhow!(
            "User with phone number already exists"
        )));
    }

    create_user(
        &ctx.connection_pool,
        CreateUserArgs {
            phone: Some(phone_number.to_owned()),
            email: None,
            password: None,
        },
    )
    .await?;

    // Generate a 6 digit random code and save to the user under phone_verification_code
    let p = 10i32.pow(5);
    let code: i32 = rand::thread_rng().gen_range(p..10 * p);
    let user = sqlx::query_as!(
        User,
        r#"
          UPDATE users SET phone_verification_code = $1 WHERE phone = $2 RETURNING *
        "#,
        code,
        phone_number
    )
    .fetch_one(&ctx.connection_pool)
    .await?;
    // Send SMS for verification
    let sms_body = "Your Breakdown verification code is: ".to_string() + &code.to_string();
    send_sms_message(&ctx, &user.phone.unwrap(), &sms_body).await?;

    Ok(Json(ResponseBody {
        data: code.to_string(),
    }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SigninSMSRequestBody {
    pub phone: String,
}
pub async fn signin_sms(
    ctx: Extension<ApiContext>,
    Json(body): Json<SigninSMSRequestBody>,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let phone_number = body.phone.to_string().to_owned();
    if body.phone.len() == 0 {
        return Err(ApiError::Anyhow(anyhow!("Phone number is required")));
    }
    let user = sqlx::query_as!(
        User,
        r#"
          SELECT * FROM users WHERE phone = $1
        "#,
        body.phone
    )
    .fetch_optional(&ctx.connection_pool)
    .await?;

    // Guard clauses
    if user.is_none() {
        return Err(ApiError::Anyhow(anyhow!("User not found for phone number")));
    }

    // Generate a 6 digit random code and save to the user under phone_verification_code
    let p = 10i32.pow(5);
    let code: i32 = rand::thread_rng().gen_range(p..10 * p);
    let user = sqlx::query_as!(
        User,
        r#"
          UPDATE users SET phone_verification_code = $1 WHERE phone = $2 RETURNING *
        "#,
        code,
        phone_number
    )
    .fetch_one(&ctx.connection_pool)
    .await?;
    // Send SMS for verification
    let sms_body = "Your Breakdown verification code is: ".to_string() + &code.to_string();
    send_sms_message(&ctx, &user.phone.unwrap(), &sms_body).await?;

    Ok(Json(ResponseBody {
        data: code.to_string(),
    }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VerifySMSRequestBody {
    pub phone: String,
    pub code: String,
}

pub async fn verify_sms(
    ctx: Extension<ApiContext>,
    Json(body): Json<VerifySMSRequestBody>,
    mut session: WritableSession,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let phone_number = body.phone.to_string().to_owned();
    let user = sqlx::query_as!(
        User,
        r#"
          SELECT * FROM users WHERE phone = $1
        "#,
        phone_number
    )
    .fetch_one(&ctx.connection_pool)
    .await?;

    if user.phone_verification_code.unwrap() != body.code.parse::<i32>().unwrap() {
        return Err(ApiError::Anyhow(anyhow!("Invalid verification code")));
    } else {
        // Update the user to set phone_verified to true
        sqlx::query_as!(
            User,
            r#"
              UPDATE users SET phone_verified = true WHERE phone = $1 RETURNING *
            "#,
            phone_number
        )
        .fetch_one(&ctx.connection_pool)
        .await?;
    }

    session
        .insert("user_id", user.id.to_string())
        .map_err(|e| ApiError::Anyhow(anyhow!("Failed to insert user_id into session: {}", e)));

    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ResendSMSRequestBody {
    pub phone: String,
}
pub async fn resend_sms(
    ctx: Extension<ApiContext>,
    Json(body): Json<ResendSMSRequestBody>,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let p = 10i32.pow(5);
    let code: i32 = rand::thread_rng().gen_range(p..10 * p);
    let user = sqlx::query_as!(
        User,
        r#"
          UPDATE users SET phone_verification_code = $1 WHERE phone = $2 RETURNING *
        "#,
        code,
        body.phone
    )
    .fetch_one(&ctx.connection_pool)
    .await?;
    // Send SMS for verification
    let sms_body = "Your Breakdown verification code is: ".to_string() + &code.to_string();
    send_sms_message(&ctx, &user.phone.unwrap(), &sms_body).await?;

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
