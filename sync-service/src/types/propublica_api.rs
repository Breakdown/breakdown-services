use serde::{Deserialize, Serialize};

// Bills
#[derive(Debug, Deserialize, Serialize)]
struct CosponsorsByParty {
    D: Option<u16>,
    R: Option<u16>,
}
#[derive(Debug, Deserialize, Serialize)]
pub struct ProPublicaBillResponse {
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
pub struct PropublicaRepsResult {
    pub members: Vec<ProPublicaRep>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ProPublicaRepsResponse {
    pub results: Vec<PropublicaRepsResult>,
}
