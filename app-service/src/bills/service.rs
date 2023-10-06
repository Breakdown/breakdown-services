use crate::{
    propublica::models::ProPublicaBill,
    reps::{models::BreakdownRep, service::fetch_rep_by_id},
    types::api::{ApiContext, GetBillsPagination, ResponseBody},
    utils::api_error::ApiError,
};
use axum::{
    extract::{Path, Query},
    Extension, Json,
};
use sqlx::{types::Uuid, PgPool};
use std::collections::HashMap;

use super::models::BreakdownBill;

pub enum HouseEnum {
    House,
    Senate,
    Joint,
    Unknown,
}
pub fn get_house_from_bill_type(bill_type: &str) -> HouseEnum {
    match bill_type {
        "hr" => HouseEnum::House,
        "s" => HouseEnum::Senate,
        "hjres" => HouseEnum::Joint,
        "sconres" => HouseEnum::Joint,
        "hconres" => HouseEnum::Joint,
        "sjres" => HouseEnum::Joint,
        "hres" => HouseEnum::House,
        "sres" => HouseEnum::Senate,
        _ => HouseEnum::Unknown,
    }
}

pub async fn get_bill_by_id(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<BreakdownBill>>, ApiError> {
    let bill_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(bill_id) => bill_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let bill = fetch_bill_by_id(&ctx, bill_id).await?;
    Ok(Json(ResponseBody { data: bill }))
}

pub async fn get_bills(
    ctx: Extension<ApiContext>,
    pagination: Query<GetBillsPagination>,
) -> Result<Json<ResponseBody<Vec<BreakdownBill>>>, ApiError> {
    let query_params: GetBillsPagination = pagination.0;
    let bills = sqlx::query_as!(
        BreakdownBill,
        r#"
            SELECT * FROM bills
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

pub async fn fetch_bill_by_id(
    ctx: &Extension<ApiContext>,
    bill_id: Uuid,
) -> Result<BreakdownBill, ApiError> {
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

    Ok(bill)
}

#[derive(Debug, Clone)]
pub enum BillAgeStatus {
    New,
    Updated,
}

#[derive(Debug, Clone)]
pub struct BillUpsertInfo {
    pub bill: BreakdownBill,
    pub status: BillAgeStatus,
}
pub async fn save_propub_bill(
    bill: ProPublicaBill,
    db_connection: &PgPool,
) -> Result<BillUpsertInfo, ApiError> {
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
    .map_err(|e| return anyhow::anyhow!("Failed to fetch bill sponsor for bill : {}", e))?;

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

    println!("primary_subject: {:?}", &bill.primary_subject);

    let committees = &vec![bill.committees.unwrap_or("".to_string())];
    // Insert or update
    match existing_bill {
        None => {
            let query_result = sqlx::query_as!(
                BreakdownBill,
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
                TO_TIMESTAMP($13, 'YYYY-MM-DD'),
                $14,
                $15,
                $16,
                $17,
                $18,
                $19,
                $20,
                $21,
                TO_TIMESTAMP($22, 'YYYY-MM-DD'),
                $23,
                $24,
                $25,
                $26,
                $27,
                $28,
                $29,
                $30
            ) returning *"#,
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
            Ok(BillUpsertInfo {
                bill: query_result,
                status: BillAgeStatus::New,
            })
        }
        Some(existing_bill) => {
            let query_result = sqlx::query_as!(
                BreakdownBill,
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
                        introduced_date = coalesce(TO_TIMESTAMP($13, 'YYYY-MM-DD'), bills.introduced_date),
                        last_vote = coalesce($14, bills.last_vote),
                        house_passage = coalesce($15, bills.house_passage),
                        senate_passage = coalesce($16, bills.senate_passage),
                        enacted = coalesce($17, bills.enacted),
                        vetoed = coalesce($18, bills.vetoed),
                        primary_subject = coalesce($19, bills.primary_subject),
                        summary = coalesce($20, bills.summary),
                        summary_short = coalesce($21, bills.summary_short),
                        latest_major_action_date = coalesce(TO_TIMESTAMP($22, 'YYYY-MM-DD'), bills.latest_major_action_date),
                        latest_major_action = coalesce($23, bills.latest_major_action),
                        active = coalesce($24, bills.active),
                        committees = coalesce($25, bills.committees),
                        committee_codes = coalesce($26, bills.committee_codes),
                        subcommittee_codes = coalesce($27, bills.subcommittee_codes),
                        cosponsors_d = coalesce($28, bills.cosponsors_d),
                        cosponsors_r = coalesce($29, bills.cosponsors_r),
                        sponsor_id = coalesce($30, bills.sponsor_id)
                    WHERE id = $1
                    returning *
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
            Ok(BillUpsertInfo {
                bill: query_result,
                status: BillAgeStatus::Updated,
            })
        }
    }
}

pub async fn get_bill_sponsor(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<BreakdownRep>>, ApiError> {
    let bill_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(bill_id) => bill_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let bill = fetch_bill_by_id(&ctx, bill_id).await?;
    let sponsor = fetch_rep_by_id(&ctx, bill.sponsor_id.unwrap()).await?;

    Ok(Json(ResponseBody { data: sponsor }))
}

pub async fn get_bill_cosponsors(
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
