use std::collections::HashMap;

use axum::{
    extract::Path,
    middleware,
    routing::{get, post},
    Extension, Json, Router,
};
use axum_macros::debug_handler;
use axum_sessions::extractors::ReadableSession;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    services::{
        bills::{fetch_bill_by_id, get_bill_by_id, get_bills},
        reps::fetch_rep_by_id,
    },
    types::{api::ResponseBody, db::BreakdownRep},
    utils::{api_error::ApiError, auth::create_session_auth_layer},
};

use super::ApiContext;

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/:id", get(get_bill_by_id))
        .route("/", get(get_bills))
        .route("/:id/vote", post(post_vote_on_bill))
        .route("/:id/sponsor", get(get_bill_sponsor))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/bills", service_router)
}

#[derive(Debug, Deserialize)]
struct BillVoteRequestBody {
    pub vote: bool,
}

#[debug_handler]
async fn post_vote_on_bill(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
    Json(body): Json<BillVoteRequestBody>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let bill_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(bill_id) => bill_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let user_id = session.get::<Uuid>("user_id").unwrap();

    let existing_relation = sqlx::query!(
        r#"
            SELECT * FROM users_votes WHERE bill_id = $1 AND user_id = $2
        "#,
        bill_id,
        user_id
    )
    .fetch_optional(&ctx.connection_pool)
    .await?;
    match existing_relation {
        Some(result) => {
            if result.vote == body.vote {
                return Ok(Json(ResponseBody {
                    data: "Vote already exists".to_string(),
                }));
            }
            sqlx::query!(
                r#"
                    UPDATE users_votes SET vote = $1 WHERE bill_id = $2 AND user_id = $3
                "#,
                body.vote,
                bill_id,
                user_id
            )
            .execute(&ctx.connection_pool)
            .await?;
            return Ok(Json(ResponseBody {
                data: "Vote updated".to_string(),
            }));
        }
        None => {
            sqlx::query!(
                r#"
                    INSERT INTO users_votes (bill_id, user_id, vote) VALUES ($1, $2, $3)
                "#,
                bill_id,
                user_id,
                body.vote
            )
            .execute(&ctx.connection_pool)
            .await?;
            return Ok(Json(ResponseBody {
                data: "Vote created".to_string(),
            }));
        }
    }
}

async fn get_bill_sponsor(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<Vec<BreakdownRep>>>, ApiError> {
    let bill_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(bill_id) => bill_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let bill = fetch_bill_by_id(&ctx, bill_id).await?;
    let sponsor = fetch_rep_by_id(&ctx, bill.sponsor_id.unwrap()).await?;

    Ok(Json(ResponseBody {
        data: vec![sponsor],
    }))
}
