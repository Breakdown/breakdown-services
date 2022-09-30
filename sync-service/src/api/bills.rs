use super::{error::ApiError, ApiContext, SuccessMessage};
use axum::{routing::post, Extension, Json, Router};
use serde::{Deserialize, Serialize};

pub fn router() -> Router {
    Router::new().route("/bills/sync", post(bills_sync))
}

#[derive(Debug, Deserialize, Serialize)]
struct CosponsorsByParty {
    D: u16,
    R: u16,
}
#[derive(Debug, Deserialize, Serialize)]
struct ProPublicaBillResponse {
    bill_id: String,
    bill_slug: String,
    bill_type: String,
    number: String,
    bill_uri: String,
    title: String,
    short_title: String,
    sponsor_title: String,
    sponsor_id: String,
    sponsor_name: String,
    sponsor_state: String,
    sponsor_party: String,
    sponsor_uri: String,
    gpo_pdf_uri: String,
    congressdotgov_url: String,
    govtrack_url: String,
    introduced_date: String,
    active: bool,
    last_vote: String,
    house_passage: String,
    senate_passage: String,
    enacted: String,
    vetoed: String,
    cosponsors: u16,
    cosponsors_by_party: CosponsorsByParty,
    committees: String,
    committee_codes: Vec<String>,
    subcommittee_codes: Vec<String>,
    primary_subject: String,
    summary: String,
    summary_short: String,
    latest_major_action_date: String,
    latest_major_action: String,
}
#[derive(Debug, Deserialize, Serialize)]
struct ProPublicaBillsResponse {
    results: Vec<ProPublicaBillResponse>,
}

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
