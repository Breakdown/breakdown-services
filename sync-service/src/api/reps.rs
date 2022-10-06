#![allow(non_snake_case)]
use super::{error::ApiError, ApiContext};
use axum::{routing::post, Extension, Router};
use serde::{Deserialize, Serialize};

pub fn router() -> Router {
    let service_router = Router::new().route("/sync", post(reps_sync));
    Router::new().nest("/reps", service_router)
}

#[derive(Debug, Deserialize, Serialize)]
struct ProPublicaRepResponse {
    id: Option<String>,
    title: Option<String>,
    short_title: Option<String>,
    api_uri: Option<String>,
    first_name: Option<String>,
    middle_name: Option<String>,
    last_name: Option<String>,
    suffix: Option<String>,
    date_of_birth: Option<String>,
    gender: Option<String>,
    party: Option<String>,
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
    senate_class: Option<String>,
    state_rank: Option<String>,
    lis_id: Option<String>,
    missed_votes_pct: Option<f64>,
    votes_with_party_pct: Option<f64>,
    votes_against_party_pct: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize)]
struct PropublicaRepsResult {
    members: Vec<ProPublicaRepResponse>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ProPublicaRepsResponse {
    results: Vec<PropublicaRepsResult>,
}

async fn reps_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    // Fetch reps from ProPublica
    // Format into our format
    // Insert/Update into DB
    Ok("Synced Representatives")
    // Err(ApiError::InternalError)
}
