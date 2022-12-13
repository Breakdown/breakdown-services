use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::db::User;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct GetMeResponse {
    pub id: Uuid,
    pub email: Option<String>,
    pub password: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub onboarded: bool,
    pub address: Option<String>,
    pub state_id: Option<Uuid>,
    pub district_id: Option<Uuid>,
    pub phone: Option<String>,
    pub phone_verified: bool,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BillWithIssues {
    
}
#[derive(Debug, Serialize, Deserialize)]
pub struct GetFeedResponse {
    pub bills: Vec<BillWithIssues>,
}
