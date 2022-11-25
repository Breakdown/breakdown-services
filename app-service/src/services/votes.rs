use crate::{types::propublica::ProPublicaVote, utils::api_error::ApiError};
use sqlx::PgPool;

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
