use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use typeshare::typeshare;
use uuid::Uuid;

use crate::config::Config;

#[derive(Clone, Debug)]
pub struct ApiContext {
    pub config: Arc<Config>,
    pub connection_pool: PgPool,
}

// Requests
#[derive(Deserialize)]
pub struct GetFeedPagination {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Deserialize)]
pub struct GetBillsPagination {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Deserialize)]
pub struct GetRepsPagination {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct ResponseBody<T> {
    pub data: T,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestState {
    pub user_id: String,
}

// Responses

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetMeResponse {
    pub id: Uuid,
    pub email: Option<String>,
    pub password: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub address: Option<String>,
    pub state_id: Option<Uuid>,
    pub district_id: Option<Uuid>,
    pub location_submitted_at: Option<DateTime<Utc>>,
    pub initial_issues_selected_at: Option<DateTime<Utc>>,
    pub phone: Option<String>,
    pub phone_verified: bool,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct FeedBill {
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
    pub sponsor_first_name: Option<String>,
    pub sponsor_last_name: Option<String>,
    pub primary_issue_name: Option<String>,
    pub primary_issue_image_url: Option<String>,
    pub sponsor_image_url: Option<String>,
    pub sponsor_short_title: Option<String>,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetFeedResponse {
    pub bills: Vec<FeedBill>,
}
