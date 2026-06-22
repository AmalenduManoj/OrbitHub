use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::stories::models::*;

pub async fn my_stories(pool: &PgPool, user_id: Uuid) -> Result<Vec<StoryResponse>, AppError> {
    let stories = sqlx::query_as::<_, StoryResponse>(
        "SELECT s.id, s.user_id, u.username, p.avatar_url,
                s.media_url, s.media_type, s.caption, s.expires_at, s.is_highlight,
                s.created_at,
                COALESCE(v.cnt, 0::bigint) AS view_count,
                COALESCE(l.cnt, 0::bigint) AS like_count,
                COALESCE(c.cnt, 0::bigint) AS comment_count,
                false AS viewed,
                false AS liked
         FROM stories s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN profiles p ON p.user_id = s.user_id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_views GROUP BY story_id) v ON v.story_id = s.id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_likes GROUP BY story_id) l ON l.story_id = s.id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_comments GROUP BY story_id) c ON c.story_id = s.id
         WHERE s.user_id = $1
           AND (s.expires_at > NOW() OR s.is_highlight = true)
         ORDER BY s.created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(stories)
}

pub async fn create_story(
    pool: &PgPool,
    user_id: Uuid,
    body: &CreateStoryRequest,
) -> Result<StoryDetailResponse, AppError> {
    if body.media_type != "image" && body.media_type != "video" {
        return Err(AppError::BadRequest("media_type must be 'image' or 'video'".into()));
    }
    if body.expires_at <= Utc::now() {
        return Err(AppError::BadRequest("expires_at must be in the future".into()));
    }
    if body.circle_ids.is_empty() {
        return Err(AppError::BadRequest("At least one circle is required".into()));
    }

    let mut tx = pool.begin().await?;

    let story = sqlx::query_as::<_, StoryDetailResponse>(
        "INSERT INTO stories (user_id, media_url, media_type, caption, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, '' as username, NULL::text as avatar_url,
                   media_url, media_type, caption, expires_at, is_highlight, created_at,
                   0::bigint as view_count, 0::bigint as like_count, 0::bigint as comment_count",
    )
    .bind(user_id)
    .bind(&body.media_url)
    .bind(&body.media_type)
    .bind(&body.caption)
    .bind(body.expires_at)
    .fetch_one(&mut *tx)
    .await?;

    for circle_id in &body.circle_ids {
        sqlx::query(
            "INSERT INTO story_circles (story_id, circle_id) VALUES ($1, $2)",
        )
        .bind(story.id)
        .bind(circle_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    let username: String = sqlx::query_scalar("SELECT username FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    Ok(StoryDetailResponse {
        username,
        ..story
    })
}

pub async fn feed(pool: &PgPool, user_id: Uuid) -> Result<Vec<StoryResponse>, AppError> {
    let stories = sqlx::query_as::<_, StoryResponse>(
        "SELECT DISTINCT ON (s.user_id)
            s.id, s.user_id, u.username, p.avatar_url,
            s.media_url, s.media_type, s.caption, s.expires_at, s.is_highlight,
            s.created_at,
            COALESCE(v.cnt, 0::bigint) AS view_count,
            COALESCE(l.cnt, 0::bigint) AS like_count,
            COALESCE(c.cnt, 0::bigint) AS comment_count,
            EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.user_id = $1) AS viewed,
            EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $1) AS liked
         FROM stories s
         JOIN story_circles sc ON sc.story_id = s.id
         JOIN circle_members cm ON cm.circle_id = sc.circle_id AND cm.user_id = $1
         JOIN users u ON u.id = s.user_id
         LEFT JOIN profiles p ON p.user_id = s.user_id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_views GROUP BY story_id) v ON v.story_id = s.id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_likes GROUP BY story_id) l ON l.story_id = s.id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_comments GROUP BY story_id) c ON c.story_id = s.id
         WHERE (s.expires_at > NOW() OR s.is_highlight = true)
         AND s.user_id != $1
         ORDER BY s.user_id, s.created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(stories)
}

pub async fn get_story(pool: &PgPool, story_id: Uuid, user_id: Uuid) -> Result<StoryDetailResponse, AppError> {
    let story = sqlx::query_as::<_, StoryDetailResponse>(
        "SELECT s.id, s.user_id, u.username, p.avatar_url,
                s.media_url, s.media_type, s.caption, s.expires_at, s.is_highlight,
                s.created_at,
                COALESCE(v.cnt, 0::bigint) AS view_count,
                COALESCE(l.cnt, 0::bigint) AS like_count,
                COALESCE(c.cnt, 0::bigint) AS comment_count
         FROM stories s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN profiles p ON p.user_id = s.user_id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_views GROUP BY story_id) v ON v.story_id = s.id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_likes GROUP BY story_id) l ON l.story_id = s.id
         LEFT JOIN (SELECT story_id, COUNT(*) AS cnt FROM story_comments GROUP BY story_id) c ON c.story_id = s.id
         WHERE s.id = $1
         AND (s.user_id = $2
              OR s.id IN (
                  SELECT sc.story_id FROM story_circles sc
                  JOIN circle_members cm ON cm.circle_id = sc.circle_id
                  WHERE cm.user_id = $2
              ))",
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Story not found".into()))?;

    Ok(story)
}

pub async fn delete_story(pool: &PgPool, story_id: Uuid, user_id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM stories WHERE id = $1 AND user_id = $2")
        .bind(story_id)
        .bind(user_id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Story not found".into()));
    }
    Ok(())
}

pub async fn view_story(pool: &PgPool, story_id: Uuid, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(story_id)
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_views(pool: &PgPool, story_id: Uuid, user_id: Uuid) -> Result<Vec<ViewerResponse>, AppError> {
    let owns_story: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM stories WHERE id = $1 AND user_id = $2)",
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !owns_story {
        return Err(AppError::NotFound("Story not found".into()));
    }

    let viewers = sqlx::query_as::<_, ViewerResponse>(
        "SELECT u.id, u.username, p.avatar_url, sv.viewed_at
         FROM story_views sv
         JOIN users u ON u.id = sv.user_id
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE sv.story_id = $1
         ORDER BY sv.viewed_at DESC",
    )
    .bind(story_id)
    .fetch_all(pool)
    .await?;

    Ok(viewers)
}

pub async fn toggle_like(pool: &PgPool, story_id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM story_likes WHERE story_id = $1 AND user_id = $2)",
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if exists {
        sqlx::query("DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2")
            .bind(story_id)
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(false)
    } else {
        sqlx::query("INSERT INTO story_likes (story_id, user_id) VALUES ($1, $2)")
            .bind(story_id)
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(true)
    }
}

pub async fn get_likes(pool: &PgPool, story_id: Uuid, user_id: Uuid) -> Result<Vec<LikeUserResponse>, AppError> {
    let owns_story: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM stories WHERE id = $1 AND user_id = $2)",
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !owns_story {
        return Err(AppError::NotFound("Story not found".into()));
    }

    let likes = sqlx::query_as::<_, LikeUserResponse>(
        "SELECT u.id, u.username, p.avatar_url, sl.created_at
         FROM story_likes sl
         JOIN users u ON u.id = sl.user_id
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE sl.story_id = $1
         ORDER BY sl.created_at DESC",
    )
    .bind(story_id)
    .fetch_all(pool)
    .await?;

    Ok(likes)
}

pub async fn add_comment(
    pool: &PgPool,
    story_id: Uuid,
    user_id: Uuid,
    content: &str,
) -> Result<CommentResponse, AppError> {
    if content.trim().is_empty() || content.len() > 500 {
        return Err(AppError::BadRequest("Comment must be 1-500 characters".into()));
    }

    let comment_id: Uuid = sqlx::query_scalar(
        "INSERT INTO story_comments (story_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING id",
    )
    .bind(story_id)
    .bind(user_id)
    .bind(content.trim())
    .fetch_one(pool)
    .await?;

    let comment = sqlx::query_as::<_, CommentResponse>(
        "SELECT c.id, c.user_id, u.username, p.avatar_url, c.content, c.created_at
         FROM story_comments c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE c.id = $1",
    )
    .bind(comment_id)
    .fetch_one(pool)
    .await?;

    Ok(comment)
}

pub async fn get_comments(
    pool: &PgPool,
    story_id: Uuid,
    user_id: Uuid,
) -> Result<Vec<CommentResponse>, AppError> {
    let owns_story: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM stories WHERE id = $1 AND user_id = $2)",
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let comments = if owns_story {
        sqlx::query_as::<_, CommentResponse>(
            "SELECT c.id, c.user_id, u.username, p.avatar_url, c.content, c.created_at
             FROM story_comments c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN profiles p ON p.user_id = u.id
             WHERE c.story_id = $1
             ORDER BY c.created_at ASC",
        )
        .bind(story_id)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, CommentResponse>(
            "SELECT c.id, c.user_id, u.username, p.avatar_url, c.content, c.created_at
             FROM story_comments c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN profiles p ON p.user_id = u.id
             WHERE c.story_id = $1 AND c.user_id = $2
             ORDER BY c.created_at ASC",
        )
        .bind(story_id)
        .bind(user_id)
        .fetch_all(pool)
        .await?
    };

    Ok(comments)
}

pub async fn delete_comment(
    pool: &PgPool,
    story_id: Uuid,
    comment_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let owns_story: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM stories WHERE id = $1 AND user_id = $2)",
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let result = if owns_story {
        sqlx::query("DELETE FROM story_comments WHERE id = $1 AND story_id = $2")
            .bind(comment_id)
            .bind(story_id)
            .execute(pool)
            .await?
    } else {
        sqlx::query(
            "DELETE FROM story_comments WHERE id = $1 AND story_id = $2 AND user_id = $3",
        )
        .bind(comment_id)
        .bind(story_id)
        .bind(user_id)
        .execute(pool)
        .await?
    };

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Comment not found".into()));
    }
    Ok(())
}

pub async fn create_highlight(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    cover_story_id: Option<Uuid>,
) -> Result<HighlightResponse, AppError> {
    if name.trim().is_empty() || name.len() > 50 {
        return Err(AppError::BadRequest("Name must be 1-50 characters".into()));
    }

    let highlight = sqlx::query_as::<_, HighlightResponse>(
        "INSERT INTO highlights (user_id, name, cover_story_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, cover_story_id, 0::bigint as story_count, created_at",
    )
    .bind(user_id)
    .bind(name.trim())
    .bind(cover_story_id)
    .fetch_one(pool)
    .await?;

    if let Some(csid) = cover_story_id {
        sqlx::query("UPDATE stories SET is_highlight = true WHERE id = $1")
            .bind(csid)
            .execute(pool)
            .await?;
    }

    Ok(highlight)
}

pub async fn list_highlights(pool: &PgPool, user_id: Uuid) -> Result<Vec<HighlightResponse>, AppError> {
    let highlights = sqlx::query_as::<_, HighlightResponse>(
        "SELECT h.id, h.name, h.cover_story_id,
                COALESCE(s.cnt, 0) AS story_count, h.created_at
         FROM highlights h
         LEFT JOIN (SELECT highlight_id, COUNT(*) AS cnt FROM highlight_stories GROUP BY highlight_id) s
            ON s.highlight_id = h.id
         WHERE h.user_id = $1
         ORDER BY h.created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(highlights)
}

pub async fn get_highlight(
    pool: &PgPool,
    highlight_id: Uuid,
    user_id: Uuid,
) -> Result<(HighlightDetailResponse, Vec<HighlightStoryRow>), AppError> {
    let highlight = sqlx::query_as::<_, HighlightDetailResponse>(
        "SELECT id, name, cover_story_id, created_at FROM highlights WHERE id = $1 AND user_id = $2",
    )
    .bind(highlight_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Highlight not found".into()))?;

    let stories = sqlx::query_as::<_, HighlightStoryRow>(
        "SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption, s.created_at
         FROM highlight_stories hs
         JOIN stories s ON s.id = hs.story_id
         WHERE hs.highlight_id = $1
         ORDER BY hs.added_at DESC",
    )
    .bind(highlight_id)
    .fetch_all(pool)
    .await?;

    Ok((highlight, stories))
}

pub async fn delete_highlight(
    pool: &PgPool,
    highlight_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM highlights WHERE id = $1 AND user_id = $2")
        .bind(highlight_id)
        .bind(user_id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Highlight not found".into()));
    }
    Ok(())
}

pub async fn add_story_to_highlight(
    pool: &PgPool,
    highlight_id: Uuid,
    story_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let owns_highlight: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM highlights WHERE id = $1 AND user_id = $2)",
    )
    .bind(highlight_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !owns_highlight {
        return Err(AppError::NotFound("Highlight not found".into()));
    }

    let owns_story: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM stories WHERE id = $1 AND user_id = $2)",
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !owns_story {
        return Err(AppError::NotFound("Story not found".into()));
    }

    sqlx::query(
        "INSERT INTO highlight_stories (highlight_id, story_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(highlight_id)
    .bind(story_id)
    .execute(pool)
    .await?;

    sqlx::query("UPDATE stories SET is_highlight = true WHERE id = $1")
        .bind(story_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn remove_story_from_highlight(
    pool: &PgPool,
    highlight_id: Uuid,
    story_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let owns_highlight: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM highlights WHERE id = $1 AND user_id = $2)",
    )
    .bind(highlight_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if !owns_highlight {
        return Err(AppError::NotFound("Highlight not found".into()));
    }

    sqlx::query(
        "DELETE FROM highlight_stories WHERE highlight_id = $1 AND story_id = $2",
    )
    .bind(highlight_id)
    .bind(story_id)
    .execute(pool)
    .await?;

    let still_in_highlight: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM highlight_stories WHERE story_id = $1)",
    )
    .bind(story_id)
    .fetch_one(pool)
    .await?;

    if !still_in_highlight {
        sqlx::query("UPDATE stories SET is_highlight = false WHERE id = $1")
            .bind(story_id)
            .execute(pool)
            .await?;
    }

    Ok(())
}
