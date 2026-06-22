use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub created_at: DateTime<Utc>,
    pub follower_count: i64,
    pub following_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct ProfileUpdateRequest {
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct UserSearchResult {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
}
