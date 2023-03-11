use crate::{
    propublica::models::ProPublicaVote,
    types::api::{ApiContext, ResponseBody},
    utils::api_error::ApiError,
    votes::models::UserVote,
};
use axum::{body::Body, extract::Path, Extension, Json};
use axum_sessions::extractors::ReadableSession;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn save_propub_vote(
    vote: ProPublicaVote,
    db_connection: &PgPool,
) -> Result<String, ApiError> {
    let bill = vote.bill.as_ref();
    match bill {
        Some(bill) => bill,
        _ => return Ok("No Bill".to_string()),
    };
    let bill_id_result = bill.unwrap().bill_id.as_ref();
    let bill_id = match bill_id_result {
        Some(bill) => bill,
        _ => return Ok("No Bill".to_string()),
    };
    let existing_vote = sqlx::query!(
        r#"
          SELECT * FROM representatives_votes WHERE rep_propublica_id = $1 AND bill_propublica_id = $2 AND roll_call = $3
        "#,
        vote.member_id,
        bill_id,
        vote.roll_call
    )
    .fetch_optional(db_connection)
    .await?;

    // Insert or update
    match existing_vote {
        None => {
            let bill = sqlx::query!(
                r#"
                  SELECT id FROM bills WHERE propublica_id = $1
                "#,
                bill_id
            )
            .fetch_optional(db_connection)
            .await?;
            let rep = sqlx::query!(
                r#"
                  SELECT id FROM representatives WHERE propublica_id = $1
                "#,
                vote.member_id
            )
            .fetch_optional(db_connection)
            .await?;
            if bill.is_none() || rep.is_none() {
                return Err(ApiError::Anyhow(anyhow::anyhow!("Bill or rep not found")));
            }
            let position = match vote.position.as_ref().unwrap().as_str() {
                "Yes" => true,
                "No" => false,
                _ => false,
            };
            let voted_at = format!(
                "{} {}",
                vote.date.as_ref().unwrap(),
                vote.time.as_ref().unwrap()
            );
            // Insert new vote
            sqlx::query!(
                r#"
                  INSERT INTO representatives_votes (
                    rep_propublica_id,
                    chamber,
                    congress,
                    congressional_session,
                    roll_call,
                    vote_uri,
                    bill_propublica_id,
                    question,
                    result,
                    position,
                    voted_at,
                    bill_id,
                    representative_id
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TO_TIMESTAMP($11, 'YYYY-MM-DD HH24:MI:ss'), $12, $13)"#,
                vote.member_id,
                vote.chamber,
                vote.congress,
                vote.session,
                vote.roll_call,
                vote.vote_uri,
                bill_id,
                vote.question,
                vote.result,
                position,
                voted_at,
                bill.unwrap().id,
                rep.unwrap().id
            )
            .execute(db_connection)
            .await
            .map_err(|e| {
                println!(
                    "Error inserting vote for rep: {}", e.to_string()
                );
                ApiError::Sqlx(e)
            })?;
            Ok("Saved".to_string())
        }
        Some(_) => {
            // Do nothing for now
            Ok("Already exists".to_string())
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserVoteParams {
    bill_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserVoteResponse {
    success: bool,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct PostUserVoteBody {
    vote: bool,
}
pub async fn post_user_vote(
    ctx: Extension<ApiContext>,
    Path(params): Path<PostUserVoteParams>,
    session: ReadableSession,
    Json(body): Json<PostUserVoteBody>,
) -> Result<Json<ResponseBody<PostUserVoteResponse>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let bill_id = match Uuid::parse_str(&params.bill_id) {
        Ok(bill_id) => bill_id,
        Err(e) => return Err(ApiError::Anyhow(anyhow::anyhow!(e))),
    };
    let existing_vote = sqlx::query_as!(
        UserVote,
        r#"
          SELECT * FROM users_votes WHERE bill_id = $1 AND user_id = $2
        "#,
        bill_id,
        user_id
    )
    .fetch_optional(&ctx.connection_pool)
    .await?;

    match existing_vote {
        None => {
            // Create vote
            sqlx::query!(
                r#"
                  INSERT INTO users_votes (bill_id, user_id, vote) VALUES ($1, $2, $3)
                "#,
                bill_id,
                user_id,
                &body.vote
            )
            .execute(&ctx.connection_pool)
            .await
            .map_err(|e| {
                println!("Error inserting vote for user: {}", e.to_string());
                ApiError::Sqlx(e)
            })?;
        }
        Some(_) => {
            // Update existing vote
            sqlx::query!(
                r#"
                  UPDATE users_votes SET vote = $1 WHERE bill_id = $2 AND user_id = $3
                "#,
                &body.vote,
                bill_id,
                user_id
            )
            .execute(&ctx.connection_pool)
            .await
            .map_err(|e| {
                println!("Error updating vote for user: {}", e.to_string());
                ApiError::Sqlx(e)
            })?;
        }
    }
    let response = PostUserVoteResponse { success: true };
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
) -> Result<Json<ResponseBody<UserVote>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let votes = sqlx::query_as!(
        UserVote,
        r#"
            SELECT * FROM users_votes WHERE user_id = $1 AND bill_id = $2
        "#,
        user_id,
        &params.bill_id
    )
    .fetch_one(&ctx.connection_pool)
    .await?;
    Ok(Json(ResponseBody { data: votes }))
}

pub async fn get_user_votes(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<Vec<UserVote>>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let votes = sqlx::query_as!(
        UserVote,
        r#"
            SELECT * FROM users_votes WHERE user_id = $1
        "#,
        user_id,
    )
    .fetch_all(&ctx.connection_pool)
    .await?;
    Ok(Json(ResponseBody { data: votes }))
}
