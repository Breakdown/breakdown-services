use std::collections::HashMap;

use crate::{
    api::{error::ApiError, ApiContext},
    types::{db::BreakdownBill, propublica_api::ProPublicaBill},
};
use axum::{extract::Path, Extension, Json};
use axum_macros::debug_handler;
use serde::Serialize;
use sqlx::{types::Uuid, PgPool};

#[derive(Debug, Serialize)]
pub struct ResponseBody<T> {
    data: T,
}

#[debug_handler]
pub async fn get_bill_by_id(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<BreakdownBill>>, ApiError> {
    let bill_id = Uuid::parse_str(&params.get("id").unwrap().to_string()).unwrap();
    let bill = sqlx::query_as!(
        BreakdownBill,
        r#"
          SELECT * FROM bills WHERE id = $1
        "#,
        bill_id
    )
    .fetch_optional(&ctx.connection_pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(ResponseBody { data: bill }))
}

pub async fn save_propub_bill(
    bill: ProPublicaBill,
    db_connection: &PgPool,
) -> Result<Uuid, ApiError> {
    // TODO: Guard clause for no bill_id
    let existing_bill = sqlx::query!(
        r#"
        SELECT * FROM bills WHERE propublica_id = $1
      "#,
        bill.bill_id
    )
    .fetch_optional(db_connection)
    .await?;

    let bill_sponsor = sqlx::query!(
        r#"
          SELECT * FROM representatives WHERE propublica_id = $1
        "#,
        bill.sponsor_id
    )
    .fetch_one(db_connection)
    .await
    .map_err(|e| ApiError::InternalError)?;

    let bill_sponsor_id = bill_sponsor.id;
    let committee_codes = &&bill.committee_codes.unwrap_or([].to_vec());
    let subcommittee_codes = &&bill.subcommittee_codes.unwrap_or([].to_vec());
    let cosponsors_d: i32 = bill
        .cosponsors_by_party
        .as_ref()
        .unwrap()
        .D
        .unwrap_or(0)
        .into();
    let cosponsors_r: i32 = bill
        .cosponsors_by_party
        .as_ref()
        .unwrap()
        .R
        .unwrap_or(0)
        .into();

    let committees = &vec![bill.committees.unwrap_or("".to_string())];
    // Insert or update
    match existing_bill {
        None => {
            let query_result = sqlx::query!(
                r#"INSERT INTO bills (
                propublica_id,
                bill_type,
                bill_code,
                bill_uri,
                title,
                short_title,
                sponsor_propublica_id,
                sponsor_state,
                sponsor_party,
                gpo_pdf_uri,
                congressdotgov_url,
                govtrack_url,
                introduced_date,
                last_vote,
                house_passage,
                senate_passage,
                enacted,
                vetoed,
                primary_subject,
                summary,
                summary_short,
                latest_major_action_date,
                latest_major_action,
                active,
                committees,
                committee_codes,
                subcommittee_codes,
                cosponsors_d,
                cosponsors_r,
                sponsor_id
            ) values (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15,
                $16,
                $17,
                $18,
                $19,
                $20,
                $21,
                $22,
                $23,
                $24,
                $25,
                $26,
                $27,
                $28,
                $29,
                $30
            ) returning id"#,
                bill.bill_id,
                bill.bill_type,
                bill.bill_slug,
                bill.bill_uri,
                bill.title,
                bill.short_title,
                bill.sponsor_id,
                bill.sponsor_state,
                bill.sponsor_party,
                bill.gpo_pdf_uri,
                bill.congressdotgov_url,
                bill.govtrack_url,
                bill.introduced_date, // TODO: Convert to UTC timestamp
                bill.last_vote,
                bill.house_passage,
                bill.senate_passage,
                bill.enacted,
                bill.vetoed,
                bill.primary_subject,
                bill.summary,
                bill.summary_short,
                bill.latest_major_action_date,
                bill.latest_major_action,
                bill.active,
                committees,
                committee_codes,
                subcommittee_codes,
                cosponsors_d,
                cosponsors_r,
                bill_sponsor_id
            )
            .fetch_one(db_connection)
            .await?;
            Ok(query_result.id)
        }
        Some(existing_bill) => {
            let query_result = sqlx::query!(
                r#"
                UPDATE bills
                    SET bill_type = coalesce($2, bills.bill_type),
                        bill_code = coalesce($3, bills.bill_code),
                        bill_uri = coalesce($4, bills.bill_uri),
                        title = coalesce($5, bills.title),
                        short_title = coalesce($6, bills.short_title),
                        sponsor_propublica_id = coalesce($7, bills.sponsor_propublica_id),
                        sponsor_state = coalesce($8, bills.sponsor_state),
                        sponsor_party = coalesce($9, bills.sponsor_party),
                        gpo_pdf_uri = coalesce($10, bills.gpo_pdf_uri),
                        congressdotgov_url = coalesce($11, bills.congressdotgov_url),
                        govtrack_url = coalesce($12, bills.govtrack_url),
                        introduced_date = coalesce($13, bills.introduced_date),
                        last_vote = coalesce($14, bills.last_vote),
                        house_passage = coalesce($15, bills.house_passage),
                        senate_passage = coalesce($16, bills.senate_passage),
                        enacted = coalesce($17, bills.enacted),
                        vetoed = coalesce($18, bills.vetoed),
                        primary_subject = coalesce($19, bills.primary_subject),
                        summary = coalesce($20, bills.summary),
                        summary_short = coalesce($21, bills.summary_short),
                        latest_major_action_date = coalesce($22, bills.latest_major_action_date),
                        latest_major_action = coalesce($23, bills.latest_major_action),
                        active = coalesce($24, bills.active),
                        committees = coalesce($25, bills.committees),
                        committee_codes = coalesce($26, bills.committee_codes),
                        subcommittee_codes = coalesce($27, bills.subcommittee_codes),
                        cosponsors_d = coalesce($28, bills.cosponsors_d),
                        cosponsors_r = coalesce($29, bills.cosponsors_r),
                        sponsor_id = coalesce($30, bills.sponsor_id)
                    WHERE id = $1
                    returning id
                "#,
                existing_bill.id,
                bill.bill_type,
                bill.bill_slug,
                bill.bill_uri,
                bill.title,
                bill.short_title,
                bill.sponsor_id,
                bill.sponsor_state,
                bill.sponsor_party,
                bill.gpo_pdf_uri,
                bill.congressdotgov_url,
                bill.govtrack_url,
                bill.introduced_date,
                bill.last_vote,
                bill.house_passage,
                bill.senate_passage,
                bill.enacted,
                bill.vetoed,
                bill.primary_subject,
                bill.summary,
                bill.summary_short,
                bill.latest_major_action_date,
                bill.latest_major_action,
                bill.active,
                committees,
                committee_codes,
                subcommittee_codes,
                cosponsors_d,
                cosponsors_r,
                bill_sponsor_id
            )
            .fetch_one(db_connection)
            .await?;
            Ok(query_result.id)
        }
    }
}
