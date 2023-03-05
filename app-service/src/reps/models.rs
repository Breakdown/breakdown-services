use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;
use uuid::Uuid;

#[typeshare]
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct BreakdownRep {
    pub id: Uuid,
    pub title: Option<String>,
    pub short_title: Option<String>,
    pub api_uri: Option<String>,
    pub first_name: Option<String>,
    pub middle_name: Option<String>,
    pub last_name: Option<String>,
    pub suffix: Option<String>,
    pub date_of_birth: Option<String>,
    pub gender: Option<String>,
    pub party: Option<String>,
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
    pub dw_nominate: Option<BigDecimal>,
    pub seniority: Option<String>,
    pub next_election: Option<String>,
    pub total_votes: Option<i32>,
    pub missed_votes: Option<i32>,
    pub total_present: Option<i32>,
    pub last_updated: Option<DateTime<Utc>>,
    pub ocd_id: Option<String>,
    pub office: Option<String>,
    pub phone: Option<String>,
    pub fax: Option<String>,
    pub state: Option<String>,
    pub district: Option<String>,
    pub senate_class: Option<String>,
    pub state_rank: Option<String>,
    pub lis_id: Option<String>,
    pub missed_votes_pct: Option<BigDecimal>,
    pub votes_with_party_pct: Option<BigDecimal>,
    pub votes_against_party_pct: Option<BigDecimal>,
    pub propublica_id: String,
    pub house: String,
    pub image_url: Option<String>,
    pub state_id: Option<Uuid>,
    pub district_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[typeshare]
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct RepresentativeVote {
    pub rep_propublica_id: Option<String>,
    pub chamber: Option<String>,
    pub congress: Option<String>,
    pub congressional_session: Option<String>,
    pub roll_call: String,
    pub vote_uri: Option<String>,
    pub bill_propublica_id: String,
    pub question: Option<String>,
    pub result: Option<String>,
    pub position: Option<bool>,
    pub voted_at: Option<DateTime<Utc>>,
    pub bill_id: Uuid,
    pub representative_id: Uuid,
}
