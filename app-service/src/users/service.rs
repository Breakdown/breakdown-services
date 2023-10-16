use super::models::User;
use crate::auth::service::hash_password;
use crate::bills::models::BreakdownBill;
use crate::issues::models::BreakdownIssue;
use crate::reps::models::BreakdownRep;
use crate::reps::service::get_representatives_by_state_and_district;
use crate::types::api::{
    ApiContext, FeedBill, GetBillsPagination, GetFeedPagination, GetMeResponse, ResponseBody,
};

use crate::utils::api_error::ApiError;
use crate::utils::geocodio::{geocode_address, geocode_lat_lon};
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
        address: user.address,
        location_submitted_at: user.location_submitted_at,
        initial_issues_selected_at: user.initial_issues_selected_at,
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
                address = coalesce($7, users.address)
            WHERE id = $1 RETURNING *
        "#,
        user_id,
        args.email,
        args.password,
        args.phone,
        args.first_name,
        args.last_name,
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
                lat_lon = coalesce($5, users.lat_lon),
                location_submitted_at = coalesce($6, users.location_submitted_at)
            WHERE id = $1
        "#,
        user_id,
        state_code,
        district_code.to_string(),
        &geocodio_result.as_ref().unwrap().formatted_address,
        &vec![
            args.lat.unwrap_or(0.0).to_string(),
            args.lon.unwrap_or(0.0).to_string()
        ],
        &chrono::Utc::now()
    )
    .execute(&ctx.connection_pool)
    .await
    .unwrap();

    let response = PostUserLocationResponse { success: true };
    Ok(Json(ResponseBody { data: response }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserSeenBillParams {
    pub bill_id: Uuid,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserSeenBillResponse {
    pub success: bool,
}
pub async fn post_user_seen_bill(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
    Path(params): Path<PostUserSeenBillParams>,
) -> Result<Json<ResponseBody<PostUserSeenBillResponse>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let bill_id = params.bill_id;
    sqlx::query!(
        r#"
            INSERT INTO users_seen_bills (user_id, bill_id) VALUES ($1, $2)
        "#,
        user_id,
        &bill_id
    )
    .execute(&ctx.connection_pool)
    .await?;
    let response = PostUserSeenBillResponse { success: true };
    Ok(Json(ResponseBody { data: response }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserFollowBillParams {
    pub bill_id: Uuid,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserFollowBillBody {
    pub following: bool,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserFollowBillResponse {
    pub success: bool,
}
pub async fn post_user_follow_bill(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
    Path(params): Path<PostUserFollowBillParams>,
    Json(body): Json<PostUserFollowBillBody>,
) -> Result<Json<ResponseBody<PostUserFollowBillResponse>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let bill_id = params.bill_id;
    let following = body.following;
    match following {
        true => {
            sqlx::query!(
                r#"
                    INSERT INTO users_following_bills (user_id, bill_id) VALUES ($1, $2)
                "#,
                user_id,
                &bill_id
            )
            .execute(&ctx.connection_pool)
            .await?;
        }
        false => {
            sqlx::query!(
                r#"
                    DELETE FROM users_following_bills WHERE user_id = $1 AND bill_id = $2
                "#,
                user_id,
                &bill_id
            )
            .execute(&ctx.connection_pool)
            .await?;
        }
    }
    let response = PostUserFollowBillResponse { success: true };
    Ok(Json(ResponseBody { data: response }))
}

pub async fn get_user_following_bills(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
    pagination: Query<GetBillsPagination>,
) -> Result<Json<ResponseBody<Vec<BreakdownBill>>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let bills = sqlx::query_as!(
        BreakdownBill,
        r#"
            SELECT b.* FROM bills b
            INNER JOIN users_following_bills ufb
            ON b.id = ufb.bill_id
            WHERE ufb.user_id = $1
            ORDER BY ufb.created_at DESC
            LIMIT COALESCE($2, 50)
            OFFSET COALESCE($3, 0)
        "#,
        user_id,
        pagination.limit,
        pagination.offset
    )
    .fetch_all(&ctx.connection_pool)
    .await?;
    Ok(Json(ResponseBody { data: bills }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetUserRepresentativesResponse {
    local: Vec<BreakdownRep>,
    following: Vec<BreakdownRep>,
}
pub async fn get_user_representatives(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<GetUserRepresentativesResponse>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let user = sqlx::query_as!(
        User,
        r#"
            SELECT * FROM users WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(&ctx.connection_pool)
    .await?;

    let mut response = GetUserRepresentativesResponse {
        local: vec![],
        following: vec![],
    };
    if !(user.state_code.is_none() || user.district_code.is_none()) {
        let local_representatives = get_representatives_by_state_and_district(
            &user.state_code.unwrap(),
            &user.district_code.unwrap(),
            &ctx.connection_pool,
        )
        .await
        .map_err(|_| ApiError::Anyhow(anyhow!("Could not get representatives")));
        response.local = local_representatives?;
    }

    let following_representatives = sqlx::query_as!(
        BreakdownRep,
        r#"
            SELECT r.* FROM representatives r
            INNER JOIN users_following_representatives ufr
            ON r.id = ufr.representative_id
            WHERE ufr.user_id = $1
        "#,
        user_id
    )
    .fetch_all(&ctx.connection_pool)
    .await?;
    response.following = following_representatives;
    Ok(Json(ResponseBody { data: response }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserFollowRepParams {
    pub rep_id: Uuid,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserFollowRepBody {
    pub following: bool,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserFollowRepResponse {
    pub success: bool,
}

pub async fn post_user_follow_rep(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
    Path(params): Path<PostUserFollowRepParams>,
    Json(body): Json<PostUserFollowRepBody>,
) -> Result<Json<ResponseBody<PostUserFollowRepResponse>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let rep_id = params.rep_id;
    let following = body.following;
    match following {
        true => {
            sqlx::query!(
                r#"
                    INSERT INTO users_following_representatives (user_id, representative_id) VALUES ($1, $2)
                "#,
                user_id,
                &rep_id
            )
            .execute(&ctx.connection_pool)
            .await?;
        }
        false => {
            sqlx::query!(
                r#"
                    DELETE FROM users_following_representatives WHERE user_id = $1 AND representative_id = $2
                "#,
                user_id,
                &rep_id
            )
            .execute(&ctx.connection_pool)
            .await?;
        }
    }
    let response = PostUserFollowRepResponse { success: true };
    Ok(Json(ResponseBody { data: response }))
}
