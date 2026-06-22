use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::user::models::{ProfileUpdateRequest, UserResponse, UserSearchResult};

pub async fn get_user_profile(pool: &PgPool, user_id: Uuid) -> Result<UserResponse, AppError> {
    let user = sqlx::query_as::<_, UserResponse>(
        "SELECT
            u.id,
            u.username,
            p.bio,
            p.avatar_url,
            p.gender,
            u.created_at,
            COALESCE(f1.cnt, 0) AS follower_count,
            COALESCE(f2.cnt, 0) AS following_count
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN (SELECT followed_id, COUNT(*) AS cnt FROM follows GROUP BY followed_id) f1 ON f1.followed_id = u.id
         LEFT JOIN (SELECT follower_id, COUNT(*) AS cnt FROM follows GROUP BY follower_id) f2 ON f2.follower_id = u.id
         WHERE u.id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    Ok(user)
}

pub async fn update_profile(
    pool: &PgPool,
    user_id: Uuid,
    body: &ProfileUpdateRequest,
) -> Result<UserResponse, AppError> {
    sqlx::query(
        "UPDATE profiles SET
            bio = COALESCE($1, bio),
            avatar_url = COALESCE($2, avatar_url),
            gender = COALESCE($3, gender)
         WHERE user_id = $4",
    )
    .bind(&body.bio)
    .bind(&body.avatar_url)
    .bind(&body.gender)
    .bind(user_id)
    .execute(pool)
    .await?;

    get_user_profile(pool, user_id).await
}

pub async fn search_users(pool: &PgPool, query: &str) -> Result<Vec<UserSearchResult>, AppError> {
    let pattern = format!("%{}%", query);
    let users = sqlx::query_as::<_, UserSearchResult>(
        "SELECT id, username, avatar_url FROM users WHERE username ILIKE $1 LIMIT 20",
    )
    .bind(&pattern)
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn follow_user(
    pool: &PgPool,
    follower_id: Uuid,
    followed_id: Uuid,
) -> Result<(), AppError> {
    if follower_id == followed_id {
        return Err(AppError::BadRequest("Cannot follow yourself".into()));
    }

    sqlx::query(
        "INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING",
    )
    .bind(follower_id)
    .bind(followed_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn unfollow_user(
    pool: &PgPool,
    follower_id: Uuid,
    followed_id: Uuid,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2")
        .bind(follower_id)
        .bind(followed_id)
        .execute(pool)
        .await?;

    Ok(())
}
