#![allow(non_snake_case)]
use std::collections::HashMap;

use super::{error::ApiError, ApiContext};
use axum::{routing::post, Extension, Router};
use serde::{Deserialize, Serialize};
use sqlx::{types::Uuid, PgPool};

pub fn router() -> Router {
    let service_router = Router::new().route("/sync", post(reps_sync));
    Router::new().nest("/reps", service_router)
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct ProPublicaRep {
    id: String,
    title: String,
    short_title: String,
    api_uri: String,
    first_name: String,
    middle_name: Option<String>,
    last_name: String,
    suffix: Option<String>,
    date_of_birth: String,
    gender: String,
    party: String,
    leadership_role: Option<String>,
    twitter_account: Option<String>,
    facebook_account: Option<String>,
    youtube_account: Option<String>,
    govtrack_id: Option<String>,
    cspan_id: Option<String>,
    votesmart_id: Option<String>,
    icpsr_id: Option<String>,
    crp_id: Option<String>,
    google_entity_id: Option<String>,
    fec_candidate_id: Option<String>,
    url: Option<String>,
    rss_url: Option<String>,
    contact_form: Option<String>,
    in_office: Option<bool>,
    cook_pvi: Option<String>,
    dw_nominate: Option<f64>,
    seniority: Option<String>,
    next_election: Option<String>,
    total_votes: Option<f64>,
    missed_votes: Option<f64>,
    total_present: Option<f64>,
    last_updated: Option<String>,
    ocd_id: Option<String>,
    office: Option<String>,
    phone: Option<String>,
    fax: Option<String>,
    state: Option<String>,
    district: Option<String>,
    senate_class: Option<String>,
    state_rank: Option<String>,
    lis_id: Option<String>,
    missed_votes_pct: Option<f64>,
    votes_with_party_pct: Option<f64>,
    votes_against_party_pct: Option<f64>,
}

// #[derive(Debug, Deserialize, Serialize, Clone)]
// struct BreakdownRep {
//     id: Option<String>,
//     title: Option<String>,
//     short_title: Option<String>,
//     api_uri: Option<String>,
//     first_name: Option<String>,
//     middle_name: Option<String>,
//     last_name: Option<String>,
//     suffix: Option<String>,
//     date_of_birth: Option<String>,
//     gender: Option<String>,
//     party: Option<String>,
//     leadership_role: Option<String>,
//     twitter_account: Option<String>,
//     facebook_account: Option<String>,
//     youtube_account: Option<String>,
//     govtrack_id: Option<String>,
//     cspan_id: Option<String>,
//     votesmart_id: Option<String>,
//     icpsr_id: Option<String>,
//     crp_id: Option<String>,
//     google_entity_id: Option<String>,
//     fec_candidate_id: Option<String>,
//     url: Option<String>,
//     rss_url: Option<String>,
//     contact_form: Option<String>,
//     in_office: Option<bool>,
//     cook_pvi: Option<String>,
//     dw_nominate: Option<f64>,
//     seniority: Option<String>,
//     next_election: Option<String>,
//     total_votes: Option<f64>,
//     missed_votes: Option<f64>,
//     total_present: Option<f64>,
//     last_updated: Option<String>,
//     ocd_id: Option<String>,
//     office: Option<String>,
//     phone: Option<String>,
//     fax: Option<String>,
//     state: Option<String>,
//     senate_class: Option<String>,
//     state_rank: Option<String>,
//     lis_id: Option<String>,
//     missed_votes_pct: Option<f64>,
//     votes_with_party_pct: Option<f64>,
//     votes_against_party_pct: Option<f64>,
//     propublica_id: Option<String>,
//     house: Option<String>,
//     // state_id: Option<String>,
//     // district_id: Option<String>,
// }

#[derive(Debug, Deserialize, Serialize)]
struct PropublicaRepsResult {
    members: Vec<ProPublicaRep>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ProPublicaRepsResponse {
    results: Vec<PropublicaRepsResult>,
}

async fn save_propub_rep(rep: ProPublicaRep, db_connection: &PgPool) -> Result<Uuid, ApiError> {
    // TODO: Get state
    let state_id_for_rep = sqlx::query!(
        r#"
            SELECT id FROM states WHERE code = $1
        "#,
        rep.state
    )
    .fetch_one(db_connection)
    .await?;
    let house_val = match rep.short_title.as_str() {
        "Sen." => "senate",
        "Rep." => "house",
        _ => "house",
    };
    // TODO: Get district if rep is congressional
    let district_id_for_rep = sqlx::query!(
        r#"
            SELECT id FROM districts WHERE code = $1
        "#,
        rep.district
    )
    .fetch_one(db_connection)
    .await?;
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
            senate_class,
            state_rank,
            lis_id,
            missed_votes_pct,
            votes_with_party_pct,
            votes_against_party_pct,
            propublica_id,
            house,
            state_id,
            district_id
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
            $33,
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
            $47,
            $48
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
        rep.dw_nominate,
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
        rep.senate_class,
        rep.state_rank,
        rep.lis_id,
        rep.missed_votes_pct,
        rep.votes_with_party_pct,
        rep.votes_against_party_pct,
        rep.id,
        house_val.to_string(),
        state_id_for_rep.id,
        district_id_for_rep.id
    )
    .fetch_one(db_connection)
    .await?;
    Ok(query_result.id)
}

async fn reps_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    let reqwest_client = reqwest::Client::new();
    // Fetch reps from ProPublica
    let get_all_reps_url = format!(
        "{}/117/{}/members.json",
        ctx.config.PROPUBLICA_BASE_URI, "house",
    );
    let get_all_senators_url = format!(
        "{}/117/{}/members.json",
        ctx.config.PROPUBLICA_BASE_URI, "senate"
    );

    let house_response = reqwest_client
        .get(&get_all_reps_url)
        .header("X-API-Key", &ctx.config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");

    let senate_response = reqwest_client
        .get(&get_all_senators_url)
        .header("X-API-Key", &ctx.config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");

    // Format into our format
    // Insert/Update into DB
    let house_results = &house_response.results[0].members;
    let senate_results = &senate_response.results[0].members;
    for rep in house_results.iter() {
        let rep_ref = rep.clone();
        let id = save_propub_rep(rep_ref, &ctx.connection_pool).await?;
        println!("saved representative: {}", id);
    }
    for rep in senate_results.iter() {
        let rep_ref = rep.clone();
        let id = save_propub_rep(rep_ref, &ctx.connection_pool).await?;
        println!("saved senator: {}", id);
    }

    Ok("Synced Representatives")
    // Err(ApiError::InternalError)
}
