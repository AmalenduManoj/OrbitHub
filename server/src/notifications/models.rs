use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct NotificationResponse {
    pub id: Uuid,
    pub actor_id: Option<Uuid>,
    pub actor_username: Option<String>,
    pub notification_type: String,
    pub story_id: Option<Uuid>,
    pub content: String,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}
