use crate::{
    issues::models::BreakdownIssue,
    types::api::{ApiContext, ResponseBody},
    utils::api_error::ApiError,
};
use axum::{extract::Path, Extension, Json};
use axum_sessions::extractors::ReadableSession;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
pub struct PutIssueImageBody {
    pub image_url: String,
}

pub async fn put_issue_image(
    ctx: Extension<ApiContext>,
    Json(body): Json<PutIssueImageBody>,
    Path(params): Path<HashMap<String, String>>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<BreakdownIssue>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let user_role = sqlx::query!(
        r#"
            SELECT role FROM users WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(&ctx.connection_pool)
    .await
    .unwrap()
    .role;

    if user_role != "admin" {
        return Err(ApiError::Unauthorized);
    }
    let issue_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(issue_id) => issue_id,
        Err(_) => return Err(ApiError::UnprocessableEntity),
    };
    let db_response = sqlx::query_as!(
        BreakdownIssue,
        r#"
            UPDATE issues
            SET image_url = $1
            WHERE id = $2
            RETURNING *
        "#,
        body.image_url,
        issue_id
    )
    .fetch_one(&ctx.connection_pool)
    .await;

    match db_response {
        Ok(db_response) => Ok(Json(ResponseBody { data: db_response })),
        Err(_) => Err(ApiError::InternalError),
    }
}
