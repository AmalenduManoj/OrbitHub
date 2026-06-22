use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateStoryRequest {
    pub media_url: String,
    pub media_type: String,
    pub caption: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub circle_ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreateHighlightRequest {
    pub name: String,
    pub cover_story_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct AddCommentRequest {
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct AddStoryToHighlightRequest {
    pub story_id: Uuid,
}

#[derive(Debug, Serialize, FromRow)]
pub struct StoryResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub media_url: String,
    pub media_type: String,
    pub caption: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub is_highlight: bool,
    pub created_at: DateTime<Utc>,
    pub view_count: i64,
    pub like_count: i64,
    pub comment_count: i64,
    pub viewed: bool,
    pub liked: bool,
}

#[derive(Debug, Serialize, FromRow)]
pub struct StoryDetailResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub media_url: String,
    pub media_type: String,
    pub caption: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub is_highlight: bool,
    pub created_at: DateTime<Utc>,
    pub view_count: i64,
    pub like_count: i64,
    pub comment_count: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ViewerResponse {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub viewed_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct LikeUserResponse {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct CommentResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct HighlightResponse {
    pub id: Uuid,
    pub name: String,
    pub cover_story_id: Option<Uuid>,
    pub story_count: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct HighlightDetailResponse {
    pub id: Uuid,
    pub name: String,
    pub cover_story_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct HighlightStoryRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub media_url: String,
    pub media_type: String,
    pub caption: Option<String>,
    pub created_at: DateTime<Utc>,
}


