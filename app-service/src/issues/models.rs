use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;
use uuid::Uuid;

#[typeshare]
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct BreakdownIssue {
    pub id: Uuid,
    pub name: Option<String>,
    pub slug: String,
    pub subjects: Option<Vec<String>>,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}
