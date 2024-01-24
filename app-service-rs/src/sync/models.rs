use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;
use uuid::Uuid;

#[typeshare]
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct BillFullText {
    pub id: Uuid,
    pub bill_id: Option<Uuid>,
    pub text: String,
    pub initial_summary: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}
