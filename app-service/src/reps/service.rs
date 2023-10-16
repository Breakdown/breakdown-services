use crate::{
    bills::models::BreakdownBill,
    propublica::models::ProPublicaRep,
    types::api::{ApiContext, GetRepsPagination, ResponseBody},
    utils::api_error::ApiError,
};
use axum::{
    extract::{Path, Query},
    Extension, Json,
};
use axum_macros::debug_handler;
use num_traits::cast::FromPrimitive;
use sqlx::{
    types::{BigDecimal, Uuid},
    PgPool,
};
use std::collections::HashMap;

use super::models::{BreakdownRep, BreakdownRepStats, RepresentativeVote};

pub async fn get_rep_by_id(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<BreakdownRep>>, ApiError> {
    let rep_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(rep_id) => rep_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let rep = sqlx::query_as!(
        BreakdownRep,
        r#"
          SELECT * FROM representatives WHERE id = $1
        "#,
        rep_id
    )
    .fetch_optional(&ctx.connection_pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(ResponseBody { data: rep }))
}

pub async fn get_rep_stats(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<BreakdownRepStats>>, ApiError> {
    let rep_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(rep_id) => rep_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let rep_stats: BreakdownRepStats = sqlx::query_as!(
        BreakdownRepStats,
        r#"
            SELECT votes_with_party_pct, missed_votes_pct, votes_against_party_pct, total_votes, missed_votes, total_present FROM representatives WHERE id = $1
        "#,
        rep_id
    ).fetch_optional(&ctx.connection_pool).await?.ok_or(ApiError::NotFound)?;
    Ok(Json(ResponseBody { data: rep_stats }))
}

pub async fn get_reps(
    ctx: Extension<ApiContext>,
    pagination: Query<GetRepsPagination>,
) -> Result<Json<ResponseBody<Vec<BreakdownRep>>>, ApiError> {
    let query_params: GetRepsPagination = pagination.0;
    let reps = sqlx::query_as!(
        BreakdownRep,
        r#"
            SELECT * FROM representatives
            ORDER BY last_updated DESC
            LIMIT COALESCE($1, 50)
            OFFSET COALESCE($2, 0)
        "#,
        query_params.limit,
        query_params.offset
    )
    .fetch_all(&ctx.connection_pool)
    .await?;

    Ok(Json(ResponseBody { data: reps }))
}

fn convert_to_bigdecimal(num: &Option<f64>) -> Option<BigDecimal> {
    let num = num.unwrap_or(0.0);
    if num > 0.0 {
        Some(BigDecimal::from_f64(num).unwrap())
    } else {
        None
    }
}

pub async fn fetch_rep_by_id(
    ctx: &Extension<ApiContext>,
    rep_id: Uuid,
) -> Result<BreakdownRep, ApiError> {
    let rep = sqlx::query_as!(
        BreakdownRep,
        r#"
          SELECT * FROM representatives WHERE id = $1
        "#,
        rep_id
    )
    .fetch_optional(&ctx.connection_pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(rep)
}

pub async fn save_propub_rep(rep: ProPublicaRep, db_connection: &PgPool) -> Result<Uuid, ApiError> {
    let existing_rep = sqlx::query!(
        r#"
          SELECT * FROM representatives WHERE propublica_id = $1
        "#,
        rep.id
    )
    .fetch_optional(db_connection)
    .await?;

    // Insert or update
    match existing_rep {
        None => {
            // Insert new rep
            let house_val = match rep.short_title.as_str() {
                "Sen." => "senate",
                "Rep." => "house",
                _ => "house",
            };
            let query_result = sqlx::query!(
                r#"insert into REPRESENTATIVES (
                  title,
                  short_title,
                  api_uri,
                  first_name,
                  middle_name,
                  last_name,
                  suffix,
                  date_of_birth,
                  gender,
                  party,
                  leadership_role,
                  twitter_account,
                  facebook_account,
                  youtube_account,
                  govtrack_id,
                  cspan_id,
                  votesmart_id,
                  icpsr_id,
                  crp_id,
                  google_entity_id,
                  fec_candidate_id,
                  url,
                  rss_url,
                  contact_form,
                  in_office,
                  cook_pvi,
                  dw_nominate,
                  seniority,
                  next_election,
                  total_votes,
                  missed_votes,
                  total_present,
                  last_updated,
                  ocd_id,
                  office,
                  phone,
                  fax,
                  state,
                  district,
                  senate_class,
                  state_rank,
                  lis_id,
                  missed_votes_pct,
                  votes_with_party_pct,
                  votes_against_party_pct,
                  propublica_id,
                  house
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
                  $30,
                  $31,
                  $32,
                  TO_TIMESTAMP($33, 'YYYY-MM-DD HH24:MI:ss TZHTZM'),
                  $34,
                  $35,
                  $36,
                  $37,
                  $38,
                  $39,
                  $40,
                  $41,
                  $42,
                  $43,
                  $44,
                  $45,
                  $46,
                  $47
              ) returning id"#,
                rep.title,
                rep.short_title,
                rep.api_uri,
                rep.first_name,
                rep.middle_name,
                rep.last_name,
                rep.suffix,
                rep.date_of_birth,
                rep.gender,
                rep.party,
                rep.leadership_role,
                rep.twitter_account,
                rep.facebook_account,
                rep.youtube_account,
                rep.govtrack_id,
                rep.cspan_id,
                rep.votesmart_id,
                rep.icpsr_id,
                rep.crp_id,
                rep.google_entity_id,
                rep.fec_candidate_id,
                rep.url,
                rep.rss_url,
                rep.contact_form,
                rep.in_office,
                rep.cook_pvi,
                convert_to_bigdecimal(&rep.dw_nominate),
                rep.seniority,
                rep.next_election,
                rep.total_votes,
                rep.missed_votes,
                rep.total_present,
                rep.last_updated,
                rep.ocd_id,
                rep.office,
                rep.phone,
                rep.fax,
                rep.state,
                rep.district,
                rep.senate_class,
                rep.state_rank,
                rep.lis_id,
                convert_to_bigdecimal(&rep.missed_votes_pct),
                convert_to_bigdecimal(&rep.votes_with_party_pct),
                convert_to_bigdecimal(&rep.votes_against_party_pct),
                rep.id,
                house_val.to_string()
            )
            .fetch_one(db_connection)
            .await
            .map_err(|e| {
                println!("Error inserting rep: {:?}", rep.id);
                ApiError::Sqlx(e)
            })?;
            Ok(query_result.id)
        }
        Some(existing_rep) => {
            // Update rep record
            let query_result = sqlx::query!(
              r#"
              UPDATE representatives
                  SET title = coalesce($2, representatives.title),
                      short_title = coalesce($3, representatives.short_title),
                      api_uri = coalesce($4, representatives.api_uri),
                      date_of_birth = coalesce($5, representatives.date_of_birth),
                      gender = coalesce($6, representatives.gender),
                      party = coalesce($7, representatives.party),
                      leadership_role = coalesce($8, representatives.leadership_role),
                      twitter_account = coalesce($9, representatives.twitter_account),
                      facebook_account = coalesce($10, representatives.facebook_account),
                      youtube_account = coalesce($11, representatives.youtube_account),
                      govtrack_id = coalesce($12, representatives.govtrack_id),
                      cspan_id = coalesce($13, representatives.cspan_id),
                      votesmart_id = coalesce($14, representatives.votesmart_id),
                      icpsr_id = coalesce($15, representatives.icpsr_id),
                      crp_id = coalesce($16, representatives.crp_id),
                      google_entity_id = coalesce($17, representatives.google_entity_id),
                      fec_candidate_id = coalesce($18, representatives.fec_candidate_id),
                      url = coalesce($19, representatives.url),
                      rss_url = coalesce($20, representatives.rss_url),
                      contact_form = coalesce($21, representatives.contact_form),
                      in_office = coalesce($22, representatives.in_office),
                      cook_pvi = coalesce($23, representatives.cook_pvi),
                      dw_nominate = coalesce($24, representatives.dw_nominate),
                      seniority = coalesce($25, representatives.seniority),
                      next_election = coalesce($26, representatives.next_election),
                      total_votes = coalesce($27, representatives.total_votes),
                      missed_votes = coalesce($28, representatives.missed_votes),
                      total_present = coalesce($29, representatives.total_present),
                      last_updated = coalesce(TO_TIMESTAMP($30, 'YYYY-MM-DD HH24:MI:ss TZHTZM'), representatives.last_updated),
                      ocd_id = coalesce($31, representatives.ocd_id),
                      office = coalesce($32, representatives.office),
                      phone = coalesce($33, representatives.phone),
                      fax = coalesce($34, representatives.fax),
                      state = coalesce($35, representatives.state),
                      district = coalesce($36, representatives.district),
                      senate_class = coalesce($37, representatives.senate_class),
                      state_rank = coalesce($38, representatives.state_rank),
                      lis_id = coalesce($39, representatives.lis_id),
                      missed_votes_pct = coalesce($40, representatives.missed_votes_pct),
                      votes_with_party_pct = coalesce($41, representatives.votes_with_party_pct),
                      votes_against_party_pct = coalesce($42, representatives.votes_against_party_pct)
              WHERE id = $1
              returning id
          "#,
            existing_rep.id,
            rep.title,
            rep.short_title,
            rep.api_uri,
            rep.date_of_birth,
            rep.gender,
            rep.party,
            rep.leadership_role,
            rep.twitter_account,
            rep.facebook_account,
            rep.youtube_account,
            rep.govtrack_id,
            rep.cspan_id,
            rep.votesmart_id,
            rep.icpsr_id,
            rep.crp_id,
            rep.google_entity_id,
            rep.fec_candidate_id,
            rep.url,
            rep.rss_url,
            rep.contact_form,
            rep.in_office,
            rep.cook_pvi,
            convert_to_bigdecimal(&rep.dw_nominate),
            rep.seniority,
            rep.next_election,
            rep.total_votes,
            rep.missed_votes,
            rep.total_present,
            rep.last_updated,
            rep.ocd_id,
            rep.office,
            rep.phone,
            rep.fax,
            rep.state,
            rep.district,
            rep.senate_class,
            rep.state_rank,
            rep.lis_id,
            convert_to_bigdecimal(&rep.missed_votes_pct),
            convert_to_bigdecimal(&rep.votes_with_party_pct),
            convert_to_bigdecimal(&rep.votes_against_party_pct),
          ).fetch_one(db_connection).await.map_err(|e| {
            println!("Error updating rep: {:?}", rep.id);
            ApiError::Sqlx(e)
        })?;
            Ok(query_result.id)
        }
    }
}

#[debug_handler]
pub async fn get_rep_votes_on_bill(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<Vec<RepresentativeVote>>>, ApiError> {
    let bill_id = match Uuid::parse_str(&params.get("bill_id").unwrap().to_string()) {
        Ok(bill_id) => bill_id,
        Err(_) => return Err(ApiError::NotFound),
    };
    let rep_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(rep_id) => rep_id,
        Err(_) => return Err(ApiError::NotFound),
    };

    let votes = sqlx::query_as!(
        RepresentativeVote,
        r#"
            SELECT * FROM representatives_votes
            WHERE bill_id = $1 AND representative_id = $2
        "#,
        bill_id,
        rep_id
    )
    .fetch_all(&ctx.connection_pool)
    .await
    .map_err(|e| {
        println!("Error getting rep vote on bill: {:?}", e);
        return ApiError::NotFound;
    })?;

    Ok(Json(ResponseBody { data: votes }))
}

#[debug_handler]
pub async fn get_rep_votes(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<Vec<RepresentativeVote>>>, ApiError> {
    let rep_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(rep_id) => rep_id,
        Err(_) => return Err(ApiError::NotFound),
    };

    let votes = sqlx::query_as!(
        RepresentativeVote,
        r#"
            SELECT * FROM representatives_votes
            WHERE representative_id = $1
            ORDER BY voted_at DESC
        "#,
        rep_id
    )
    .fetch_all(&ctx.connection_pool)
    .await
    .map_err(|_| {
        println!("Error getting rep votes: rep_id {}", rep_id);
        return ApiError::NotFound;
    })?;

    Ok(Json(ResponseBody { data: votes }))
}

pub async fn get_rep_sponsored_bills(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<Vec<BreakdownBill>>>, ApiError> {
    let rep_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(rep_id) => rep_id,
        Err(_) => return Err(ApiError::NotFound),
    };

    let bills = sqlx::query_as!(
        BreakdownBill,
        r#"
            SELECT * FROM bills
            WHERE sponsor_id = $1
            ORDER BY latest_major_action_date DESC
        "#,
        rep_id
    )
    .fetch_all(&ctx.connection_pool)
    .await
    .map_err(|_| {
        println!("Error getting rep sponsored bills: rep_id {}", rep_id);
        return ApiError::NotFound;
    })?;

    Ok(Json(ResponseBody { data: bills }))
}

pub async fn get_rep_cosponsored_bills(
    ctx: Extension<ApiContext>,
    Path(params): Path<HashMap<String, String>>,
) -> Result<Json<ResponseBody<Vec<BreakdownBill>>>, ApiError> {
    let rep_id = match Uuid::parse_str(&params.get("id").unwrap().to_string()) {
        Ok(rep_id) => rep_id,
        Err(_) => return Err(ApiError::NotFound),
    };

    // Get cosponsored bills for this rep_id
    let bills = sqlx::query_as!(
        BreakdownBill,
        r#"
            SELECT * FROM bills
            WHERE id IN (
                SELECT bill_id FROM cosponsors
                WHERE rep_id = $1
            )
            ORDER BY latest_major_action_date DESC
        "#,
        rep_id
    )
    .fetch_all(&ctx.connection_pool)
    .await
    .map_err(|_| {
        println!("Error getting rep sponsored bills: rep_id {}", rep_id);
        return ApiError::NotFound;
    })?;

    Ok(Json(ResponseBody { data: bills }))
}

pub async fn get_representatives_by_state_and_district(
    state: &str,
    district: &str,
    db_connection: &PgPool,
) -> Result<Vec<BreakdownRep>, ApiError> {
    let representatives = sqlx::query_as!(
        BreakdownRep,
        r#"
            SELECT * FROM representatives
            WHERE state = $1 AND district = $2
        "#,
        state,
        district
    )
    .fetch_all(db_connection)
    .await
    .map_err(|e| {
        println!(
            "Error getting representatives by state and district: {:?}",
            e
        );
        return ApiError::NotFound;
    })?;

    Ok(representatives)
}
