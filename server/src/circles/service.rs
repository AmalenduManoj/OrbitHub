use sqlx::PgPool;
use uuid::Uuid;

use crate::circles::models::*;
use crate::error::AppError;

pub async fn create_circle(
    pool: &PgPool,
    owner_id: Uuid,
    name: &str,
) -> Result<CircleResponse, AppError> {
    if name.trim().is_empty() || name.len() > 50 {
        return Err(AppError::BadRequest(
            "Circle name must be 1-50 characters".into(),
        ));
    }

    let circle = sqlx::query_as::<_, CircleRow>(
        "INSERT INTO circles (name, owner_id) VALUES ($1, $2) RETURNING id, name, owner_id, created_at",
    )
    .bind(name.trim())
    .bind(owner_id)
    .fetch_one(pool)
    .await?;

    Ok(CircleResponse {
        id: circle.id,
        name: circle.name,
        owner_id: circle.owner_id,
        created_at: circle.created_at,
        member_count: 0,
    })
}

pub async fn list_circles(pool: &PgPool, owner_id: Uuid) -> Result<Vec<CircleResponse>, AppError> {
    let circles = sqlx::query_as::<_, CircleResponse>(
        "SELECT c.id, c.name, c.owner_id, c.created_at,
                COALESCE(m.cnt, 0) AS member_count
         FROM circles c
         LEFT JOIN (SELECT circle_id, COUNT(*) AS cnt FROM circle_members GROUP BY circle_id) m ON m.circle_id = c.id
         WHERE c.owner_id = $1
         ORDER BY c.created_at DESC",
    )
    .bind(owner_id)
    .fetch_all(pool)
    .await?;

    Ok(circles)
}

pub async fn get_circle(
    pool: &PgPool,
    circle_id: Uuid,
    owner_id: Uuid,
) -> Result<CircleResponse, AppError> {
    let circle = sqlx::query_as::<_, CircleResponse>(
        "SELECT c.id, c.name, c.owner_id, c.created_at,
                COALESCE(m.cnt, 0) AS member_count
         FROM circles c
         LEFT JOIN (SELECT circle_id, COUNT(*) AS cnt FROM circle_members GROUP BY circle_id) m ON m.circle_id = c.id
         WHERE c.id = $1 AND c.owner_id = $2",
    )
    .bind(circle_id)
    .bind(owner_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Circle not found".into()))?;

    Ok(circle)
}

pub async fn update_circle(
    pool: &PgPool,
    circle_id: Uuid,
    owner_id: Uuid,
    name: &str,
) -> Result<CircleResponse, AppError> {
    if name.trim().is_empty() || name.len() > 50 {
        return Err(AppError::BadRequest(
            "Circle name must be 1-50 characters".into(),
        ));
    }

    let circle = sqlx::query_as::<_, CircleRow>(
        "UPDATE circles SET name = $1 WHERE id = $2 AND owner_id = $3
         RETURNING id, name, owner_id, created_at",
    )
    .bind(name.trim())
    .bind(circle_id)
    .bind(owner_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Circle not found".into()))?;

    let member_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM circle_members WHERE circle_id = $1",
    )
    .bind(circle_id)
    .fetch_one(pool)
    .await?;

    Ok(CircleResponse {
        id: circle.id,
        name: circle.name,
        owner_id: circle.owner_id,
        created_at: circle.created_at,
        member_count: member_count.0,
    })
}

pub async fn delete_circle(
    pool: &PgPool,
    circle_id: Uuid,
    owner_id: Uuid,
) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM circles WHERE id = $1 AND owner_id = $2")
        .bind(circle_id)
        .bind(owner_id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Circle not found".into()));
    }

    Ok(())
}

pub async fn add_members(
    pool: &PgPool,
    circle_id: Uuid,
    owner_id: Uuid,
    user_ids: &[Uuid],
) -> Result<(), AppError> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM circles WHERE id = $1 AND owner_id = $2)",
    )
    .bind(circle_id)
    .bind(owner_id)
    .fetch_one(pool)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Circle not found".into()));
    }

    for &user_id in user_ids {
        let follows: (bool,) = sqlx::query_as(
            "SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2)",
        )
        .bind(user_id)
        .bind(owner_id)
        .fetch_one(pool)
        .await?;

        if !follows.0 {
            return Err(AppError::BadRequest(
                format!("User {} does not follow you", user_id),
            ));
        }

        sqlx::query(
            "INSERT INTO circle_members (circle_id, user_id, added_by)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        )
        .bind(circle_id)
        .bind(user_id)
        .bind(owner_id)
        .execute(pool)
        .await?;
    }

    Ok(())
}

pub async fn list_members(
    pool: &PgPool,
    circle_id: Uuid,
    owner_id: Uuid,
) -> Result<Vec<CircleMemberResponse>, AppError> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM circles WHERE id = $1 AND owner_id = $2)",
    )
    .bind(circle_id)
    .bind(owner_id)
    .fetch_one(pool)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Circle not found".into()));
    }

    let members = sqlx::query_as::<_, CircleMemberResponse>(
        "SELECT u.id, u.username, p.avatar_url, cm.created_at AS added_at
         FROM circle_members cm
         JOIN users u ON u.id = cm.user_id
         LEFT JOIN profiles p ON p.user_id = cm.user_id
         WHERE cm.circle_id = $1
         ORDER BY cm.created_at DESC",
    )
    .bind(circle_id)
    .fetch_all(pool)
    .await?;

    Ok(members)
}

pub async fn remove_member(
    pool: &PgPool,
    circle_id: Uuid,
    owner_id: Uuid,
    member_id: Uuid,
) -> Result<(), AppError> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM circles WHERE id = $1 AND owner_id = $2)",
    )
    .bind(circle_id)
    .bind(owner_id)
    .fetch_one(pool)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Circle not found".into()));
    }

    sqlx::query(
        "DELETE FROM circle_members WHERE circle_id = $1 AND user_id = $2",
    )
    .bind(circle_id)
    .bind(member_id)
    .execute(pool)
    .await?;

    Ok(())
}
