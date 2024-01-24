use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;
use uuid::Uuid;

#[typeshare]
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: Option<String>,
    pub password: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: String,
    pub address: Option<String>,
    pub state_id: Option<Uuid>,
    pub district_id: Option<Uuid>,
    pub phone: Option<String>,
    pub phone_verification_code: Option<i32>,
    pub phone_verified: bool,
    pub email_verified: bool,
    pub location_submitted_at: Option<DateTime<Utc>>,
    pub initial_issues_selected_at: Option<DateTime<Utc>>,
    pub lat_lon: Option<Vec<String>>,
    pub state_code: Option<String>,
    pub district_code: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}
