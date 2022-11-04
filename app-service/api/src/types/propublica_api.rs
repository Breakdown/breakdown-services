#![allow(non_snake_case)]
use serde::{Deserialize, Serialize};

// Bills
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CosponsorsByParty {
    pub D: Option<u16>,
    pub R: Option<u16>,
}
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ProPublicaBill {
    pub bill_id: Option<String>,
    pub bill_slug: Option<String>,
    pub bill_type: Option<String>,
    pub number: Option<String>,
    pub bill_uri: Option<String>,
    pub title: Option<String>,
    pub short_title: Option<String>,
    pub sponsor_title: Option<String>,
    pub sponsor_id: Option<String>,
    pub sponsor_name: Option<String>,
    pub sponsor_state: Option<String>,
    pub sponsor_party: Option<String>,
    pub sponsor_uri: Option<String>,
    pub gpo_pdf_uri: Option<String>,
    pub congressdotgov_url: Option<String>,
    pub govtrack_url: Option<String>,
    pub introduced_date: Option<String>,
    pub active: Option<bool>,
    pub last_vote: Option<String>,
    pub house_passage: Option<String>,
    pub senate_passage: Option<String>,
    pub enacted: Option<String>,
    pub vetoed: Option<String>,
    pub cosponsors: Option<u16>,
    pub cosponsors_by_party: Option<CosponsorsByParty>,
    pub committees: Option<String>,
    pub committee_codes: Option<Vec<String>>,
    pub subcommittee_codes: Option<Vec<String>>,
    pub primary_subject: Option<String>,
    pub summary: Option<String>,
    pub summary_short: Option<String>,
    pub latest_major_action_date: Option<String>,
    pub latest_major_action: Option<String>,
}

// Reps
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ProPublicaRep {
    pub id: String,
    pub title: String,
    pub short_title: String,
    pub api_uri: String,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub suffix: Option<String>,
    pub date_of_birth: String,
    pub gender: String,
    pub party: String,
    pub leadership_role: Option<String>,
    pub twitter_account: Option<String>,
    pub facebook_account: Option<String>,
    pub youtube_account: Option<String>,
    pub govtrack_id: Option<String>,
    pub cspan_id: Option<String>,
    pub votesmart_id: Option<String>,
    pub icpsr_id: Option<String>,
    pub crp_id: Option<String>,
    pub google_entity_id: Option<String>,
    pub fec_candidate_id: Option<String>,
    pub url: Option<String>,
    pub rss_url: Option<String>,
    pub contact_form: Option<String>,
    pub in_office: Option<bool>,
    pub cook_pvi: Option<String>,
    pub dw_nominate: Option<f64>,
    pub seniority: Option<String>,
    pub next_election: Option<String>,
    pub total_votes: Option<f64>,
    pub missed_votes: Option<f64>,
    pub total_present: Option<f64>,
    pub last_updated: Option<String>,
    pub ocd_id: Option<String>,
    pub office: Option<String>,
    pub phone: Option<String>,
    pub fax: Option<String>,
    pub state: Option<String>,
    pub district: Option<String>,
    pub senate_class: Option<String>,
    pub state_rank: Option<String>,
    pub lis_id: Option<String>,
    pub missed_votes_pct: Option<f64>,
    pub votes_with_party_pct: Option<f64>,
    pub votes_against_party_pct: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ProPublicaRepsResult {
    pub members: Vec<ProPublicaRep>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ProPublicaRepsResponse {
    pub results: Vec<ProPublicaRepsResult>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ProPublicaBillsResult {
    pub bills: Vec<ProPublicaBill>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ProPublicaBillsResponse {
    pub results: Vec<ProPublicaBillsResult>,
}
