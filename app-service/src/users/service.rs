use super::models::User;
use crate::auth::service::hash_password;
use crate::issues::models::BreakdownIssue;
use crate::types::api::{ApiContext, FeedBill, GetFeedPagination, GetMeResponse, ResponseBody};
use crate::utils::api_error::ApiError;
use crate::utils::geocodio::{geocode_address, geocode_lat_lon};
use crate::votes::models::UserVote;
use anyhow::anyhow;
use axum::extract::{Path, Query};
use axum::{Extension, Json};
use axum_sessions::extractors::ReadableSession;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn get_user_bills(
    ctx: Extension<ApiContext>,
    pagination: Query<GetFeedPagination>,
) -> Result<Json<ResponseBody<Vec<FeedBill>>>, ApiError> {
    let query_params: GetFeedPagination = pagination.0;
    let bills = sqlx::query_as!(
        FeedBill,
        r#"
            SELECT b.*,
                r.first_name as sponsor_first_name,
                r.last_name as sponsor_last_name,
                r.image_url as sponsor_image_url,
                r.short_title as sponsor_short_title,
                pi.name as primary_issue_name,
                pi.image_url as primary_issue_image_url
            FROM bills b
            LEFT OUTER JOIN representatives r
            ON b.sponsor_id = r.id
            LEFT OUTER JOIN issues pi
            ON b.primary_issue_id = pi.id
            ORDER BY latest_major_action_date DESC
            LIMIT COALESCE($1, 50)
            OFFSET COALESCE($2, 0)
        "#,
        query_params.limit,
        query_params.offset
    )
    .fetch_all(&ctx.connection_pool)
    .await?;

    Ok(Json(ResponseBody { data: bills }))
}

pub async fn get_me(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<GetMeResponse>>, ApiError> {
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
    let response = GetMeResponse {
        id: user.id,
        email: user.email,
        password: user.password,
        first_name: user.first_name,
        last_name: user.last_name,
        onboarded: user.onboarded,
        address: user.address,
        state_id: user.state_id,
        district_id: user.district_id,
        phone: user.phone,
        phone_verified: user.phone_verified,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
    Ok(Json(ResponseBody { data: response }))
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
            println!("Failed to create user: {}", e);
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

#[derive(Serialize, Deserialize, Debug)]
pub struct PatchUserArgs {
    pub email: Option<String>,
    pub password: Option<String>,
    pub phone: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub onboarded: Option<bool>,
    pub address: Option<String>,
}
pub async fn patch_user(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
    Json(args): Json<PatchUserArgs>,
) -> Result<Json<ResponseBody<User>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let user = sqlx::query_as!(
        User,
        r#"
        UPDATE users
            SET email = coalesce($2, users.email),
                password = coalesce($3, users.password),
                phone = coalesce($4, users.phone),
                first_name = coalesce($5, users.first_name),
                last_name = coalesce($6, users.last_name),
                onboarded = coalesce($7, users.onboarded),
                address = coalesce($8, users.address)
            WHERE id = $1 RETURNING *
        "#,
        user_id,
        args.email,
        args.password,
        args.phone,
        args.first_name,
        args.last_name,
        args.onboarded,
        args.address
    )
    .fetch_one(&ctx.connection_pool)
    .await
    .unwrap();
    Ok(Json(ResponseBody { data: user }))
}

pub async fn get_user_issues(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<Vec<BreakdownIssue>>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let issues = sqlx::query_as!(
        BreakdownIssue,
        r#"
            SELECT i.* FROM issues i 
            INNER JOIN users_issues ui
            ON i.id = ui.issue_id
            WHERE ui.user_id = $1
        "#,
        user_id
    )
    .fetch_all(&ctx.connection_pool)
    .await?;
    Ok(Json(ResponseBody { data: issues }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserLocationArgs {
    pub address: Option<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserLocationResponse {
    pub success: bool,
}
pub async fn post_user_location(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
    Json(args): Json<PostUserLocationArgs>,
) -> Result<Json<ResponseBody<PostUserLocationResponse>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let geocodio_result = match args.address {
        Some(address) => {
            let geocoded_address = geocode_address(&address, &ctx.config.GEOCODIO_API_KEY)
                .await
                .map_err(|_| ApiError::Anyhow(anyhow!("Could not geocode address")));
            match geocoded_address {
                Ok(geocoded_address) => Some(geocoded_address),
                Err(_) => None,
            }
        }
        None => {
            let geocoded_address = geocode_lat_lon(&args.lat.unwrap(), &args.lon.unwrap())
                .await
                .map_err(|_| ApiError::Anyhow(anyhow!("Could not geocode lat lon")));
            match geocoded_address {
                Ok(geocoded_address) => Some(geocoded_address),
                Err(_) => None,
            }
        }
    };

    if geocodio_result.is_none() {
        return Err(ApiError::Anyhow(anyhow!(
            "Got no response for geocoding location"
        )));
    }
    let state_code = &geocodio_result.as_ref().unwrap().state;
    let district_code = &geocodio_result.as_ref().unwrap().district;
    // Save state and district codes on user
    sqlx::query!(
        r#"
        UPDATE users
            SET state_code = coalesce($2, users.state_code),
                district_code = coalesce($3, users.district_code),
                address = coalesce($4, users.address),
                lat_lon = coalesce($5, users.lat_lon)
            WHERE id = $1
        "#,
        user_id,
        state_code,
        district_code.to_string(),
        &geocodio_result.as_ref().unwrap().formatted_address,
        &vec![
            args.lat.unwrap_or(0.0).to_string(),
            args.lon.unwrap_or(0.0).to_string()
        ]
    )
    .execute(&ctx.connection_pool)
    .await
    .unwrap();

    let response = PostUserLocationResponse { success: true };
    Ok(Json(ResponseBody { data: response }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetUserVotesParams {
    bill_id: Uuid,
}

pub async fn get_user_bill_vote(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
    Path(params): Path<GetUserVotesParams>,
) -> Result<Json<ResponseBody<Vec<UserVote>>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let votes = sqlx::query_as!(
        UserVote,
        r#"
            SELECT * FROM users_votes WHERE user_id = $1 AND bill_id = $2
        "#,
        user_id,
        &params.bill_id
    )
    .fetch_all(&ctx.connection_pool)
    .await?;
    Ok(Json(ResponseBody { data: votes }))
}

pub async fn get_user_votes(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<Vec<UserVote>>>, ApiError> {
    // let user_id = session.get::<Uuid>("user_id").unwrap();
    // let votes = sqlx::query_as!(
    //     Vote,
    //     r#"
    //         SELECT * FROM votes WHERE user_id = $1
    //     "#,
    //     user_id
    // )
    // .fetch_all(&ctx.connection_pool)
    // .await?;
    // Ok(Json(ResponseBody { data: votes }))
    todo!()
}
