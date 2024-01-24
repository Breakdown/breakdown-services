use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;
use uuid::Uuid;

#[typeshare]
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserVote {
    pub bill_id: Uuid,
    pub user_id: Uuid,
    pub vote: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}
