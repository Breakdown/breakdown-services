use std::collections::HashMap;

use axum::{extract::Path, Extension, Json};
use uuid::Uuid;

use crate::{
    api::ApiContext,
    types::{api::ResponseBody, db::BreakdownIssue},
    utils::api_error::ApiError,
};

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
