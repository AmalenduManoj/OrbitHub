use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateCircleRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCircleRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct AddMembersRequest {
    pub user_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct CircleResponse {
    pub id: Uuid,
    pub name: String,
    pub owner_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub member_count: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct CircleMemberResponse {
    pub id: Uuid,
    pub username: String,
    pub avatar_url: Option<String>,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, FromRow)]
pub struct CircleRow {
    pub id: Uuid,
    pub name: String,
    pub owner_id: Uuid,
    pub created_at: DateTime<Utc>,
}


