use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;
use uuid::Uuid;

#[typeshare]
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct BreakdownBill {
    pub id: Uuid,
    pub primary_issue_id: Option<Uuid>,
    pub sponsor_id: Option<Uuid>,
    pub propublica_id: String,
    pub bill_code: Option<String>,
    pub bill_uri: Option<String>,
    pub bill_type: Option<String>,
    pub title: Option<String>,
    pub short_title: Option<String>,
    pub sponsor_propublica_id: Option<String>,
    pub sponsor_state: Option<String>,
    pub sponsor_party: Option<String>,
    pub gpo_pdf_uri: Option<String>,
    pub congressdotgov_url: Option<String>,
    pub govtrack_url: Option<String>,
    pub introduced_date: Option<DateTime<Utc>>,
    pub last_vote: Option<String>,
    pub house_passage: Option<String>,
    pub senate_passage: Option<String>,
    pub enacted: Option<String>,
    pub vetoed: Option<String>,
    pub primary_subject: Option<String>,
    pub summary: Option<String>,
    pub summary_short: Option<String>,
    pub latest_major_action_date: Option<DateTime<Utc>>,
    pub latest_major_action: Option<String>,
    pub legislative_day: Option<String>,
    pub active: Option<bool>,
    pub committees: Option<Vec<String>>,
    pub committee_codes: Option<Vec<String>>,
    pub subcommittee_codes: Option<Vec<String>>,
    pub cosponsors_d: Option<i32>,
    pub cosponsors_r: Option<i32>,
    pub subjects: Option<Vec<String>>,
    pub edited: Option<bool>,
    pub human_summary: Option<String>,
    pub human_short_summary: Option<String>,
    pub human_title: Option<String>,
    pub human_short_title: Option<String>,
    pub importance: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}
