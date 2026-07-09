use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ConversationResponse {
    pub id: Uuid,
    pub other_user_id: Uuid,
    pub other_username: String,
    pub other_avatar_url: Option<String>,
    pub last_message: Option<String>,
    pub last_message_at: Option<DateTime<Utc>>,
    pub last_message_sender_id: Option<Uuid>,
    pub unread_count: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MessageResponse {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub seen_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateConversationRequest {
    pub user_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct MessageQuery {
    pub before: Option<DateTime<Utc>>,
}
