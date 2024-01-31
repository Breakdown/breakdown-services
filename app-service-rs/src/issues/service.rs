use std::collections::HashMap;

use axum::{extract::Path, Extension, Json};
use axum_sessions::extractors::ReadableSession;
use uuid::Uuid;

use crate::{
    bills::models::BreakdownBill,
    types::api::{ApiContext, ResponseBody},
    utils::api_error::ApiError,
};

use super::models::BreakdownIssue;

pub async fn get_issue_by_id(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<BreakdownIssue>>, ApiError> {
    let issue_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(issue_id) => issue_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let issue = sqlx::query_as!(
        BreakdownIssue,
        r#"
          SELECT * FROM issues WHERE id = $1
        "#,
        issue_id
    )
    .fetch_optional(&ctx.connection_pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(ResponseBody { data: issue }))
}

pub async fn get_issues(
    ctx: Extension<ApiContext>,
) -> Result<Json<ResponseBody<Vec<BreakdownIssue>>>, ApiError> {
    let issues = sqlx::query_as!(
        BreakdownIssue,
        r#"
          SELECT * FROM issues
        "#,
    )
    .fetch_all(&ctx.connection_pool)
    .await?;

    Ok(Json(ResponseBody { data: issues }))
}

pub async fn follow_issue(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let issue_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(issue_id) => issue_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let existing_relation = sqlx::query!(
        r#"
          SELECT * FROM users_issues WHERE issue_id = $1 AND user_id = $2
        "#,
        issue_id,
        user_id
    )
    .fetch_optional(&ctx.connection_pool)
    .await?;

    match existing_relation {
        Some(_) => {
            return Ok(Json(ResponseBody {
                data: "ok".to_string(),
            }))
        }
        None => {
            sqlx::query!(
                r#"
                  INSERT INTO users_issues (issue_id, user_id) VALUES ($1, $2)
                "#,
                issue_id,
                user_id
            )
            .execute(&ctx.connection_pool)
            .await?;
            // Set initial_issues_selected_at if not present on user already
            let now = chrono::Utc::now();
            sqlx::query!(
                r#"
                  UPDATE users SET initial_issues_selected_at = $1 WHERE id = $2 AND initial_issues_selected_at IS NULL
                "#,
                now,
                user_id
            )
            .execute(&ctx.connection_pool)
            .await?;

            Ok(Json(ResponseBody {
                data: "ok".to_string(),
            }))
        }
    }
}

pub async fn unfollow_issue(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let issue_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(issue_id) => issue_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let user_id = session.get::<Uuid>("user_id").unwrap();
    sqlx::query!(
        r#"
          DELETE FROM users_issues WHERE issue_id = $1 AND user_id = $2
        "#,
        issue_id,
        user_id
    )
    .execute(&ctx.connection_pool)
    .await?;
    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}

pub async fn get_issue_bills(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<Vec<BreakdownBill>>>, ApiError> {
    let issue_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(issue_id) => issue_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    // Get bills where primary issue is issue_id
    // Get bills joined on bills_issues
    let mut primary_issue_bills = sqlx::query_as!(
        BreakdownBill,
        r#"
          SELECT * FROM bills WHERE primary_issue_id = $1
        "#,
        issue_id
    )
    .fetch_all(&ctx.connection_pool)
    .await?;

    let issue_bills = sqlx::query_as!(
        BreakdownBill,
        r#"
            SELECT * FROM bills
            WHERE id IN (
                SELECT bill_id FROM bills_issues
                WHERE issue_id = $1
            )
            ORDER BY latest_major_action_date DESC
        "#,
        issue_id
    )
    .fetch_all(&ctx.connection_pool)
    .await?;

    primary_issue_bills.append(&mut issue_bills.clone());
    Ok(Json(ResponseBody {
        data: primary_issue_bills,
    }))
}
