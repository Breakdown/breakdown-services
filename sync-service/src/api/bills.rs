#![allow(non_snake_case)]
use super::{error::ApiError, ApiContext, SuccessMessage};
use axum::{routing::post, Extension, Json, Router};
use serde::{Deserialize, Serialize};

pub fn router() -> Router {
    let service_router = Router::new().route("/sync", post(bills_sync));
    Router::new().nest("/bills", service_router)
}

#[derive(Debug, Deserialize, Serialize)]
struct CosponsorsByParty {
    D: Option<u16>,
    R: Option<u16>,
}
#[derive(Debug, Deserialize, Serialize)]
struct ProPublicaBillResponse {
    bill_id: Option<String>,
    bill_slug: Option<String>,
    bill_type: Option<String>,
    number: Option<String>,
    bill_uri: Option<String>,
    title: Option<String>,
    short_title: Option<String>,
    sponsor_title: Option<String>,
    sponsor_id: Option<String>,
    sponsor_name: Option<String>,
    sponsor_state: Option<String>,
    sponsor_party: Option<String>,
    sponsor_uri: Option<String>,
    gpo_pdf_uri: Option<String>,
    congressdotgov_url: Option<String>,
    govtrack_url: Option<String>,
    introduced_date: Option<String>,
    active: Option<bool>,
    last_vote: Option<String>,
    house_passage: Option<String>,
    senate_passage: Option<String>,
    enacted: Option<String>,
    vetoed: Option<String>,
    cosponsors: Option<u16>,
    cosponsors_by_party: Option<CosponsorsByParty>,
    committees: Option<String>,
    committee_codes: Option<Vec<String>>,
    subcommittee_codes: Option<Vec<String>>,
    primary_subject: Option<String>,
    summary: Option<String>,
    summary_short: Option<String>,
    latest_major_action_date: Option<String>,
    latest_major_action: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct PropublicaBillsResult {
    bills: Vec<ProPublicaBillResponse>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ProPublicaBillsResponse {
    results: Vec<PropublicaBillsResult>,
}

// let response = reqwest::Client::new()
//     .get("http://127.0.0.1:8090/lookup")
//     .json(&job)
//     .send()
//     .await
//     .map_err(|e|...)?;

async fn bills_sync(ctx: Extension<ApiContext>) -> Result<Json<SuccessMessage>, ApiError> {
    // Fetch bills from ProPublica
    let get_all_bills_url = format!(
        "{}{}",
        ctx.config.PROPUBLICA_BASE_URI, "/117/house/bills/introduced.json"
    );
    let reqwest_client = reqwest::Client::new();

    let response = reqwest_client
        .get(&get_all_bills_url)
        .header("X-API-Key", &ctx.config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaBillsResponse>()
        .await
        .expect("Failed to parse json");
    println!("{:#?}", response);

    // Format into our format
    // Insert/Update into DB
    Ok(Json(SuccessMessage { success: true }))
    // Err(ApiError::InternalError)
}
