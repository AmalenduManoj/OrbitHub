use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::chat::models::{ConversationResponse, MessageResponse, SendMessageRequest};
use crate::chat::ws::ChatWsClients;
use crate::error::AppError;

pub async fn list_conversations(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<ConversationResponse>, AppError> {
    let rows = sqlx::query_as::<_, ConversationResponse>(
        "WITH last_msgs AS (
            SELECT DISTINCT ON (m.conversation_id)
                m.conversation_id,
                m.content AS last_message,
                m.created_at AS last_message_at,
                m.sender_id AS last_message_sender_id
            FROM messages m
            ORDER BY m.conversation_id, m.created_at DESC
        ),
        unread_counts AS (
            SELECT m.conversation_id, COUNT(*) AS unread_count
            FROM messages m
            WHERE m.seen_at IS NULL AND m.sender_id != $1
            GROUP BY m.conversation_id
        )
        SELECT
            c.id,
            u.id AS other_user_id,
            u.username AS other_username,
            p.avatar_url AS other_avatar_url,
            lm.last_message,
            lm.last_message_at,
            lm.last_message_sender_id,
            COALESCE(uc.unread_count, 0) AS unread_count
        FROM conversation_participants cp
        JOIN conversations c ON c.id = cp.conversation_id
        JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id != $1
        JOIN users u ON u.id = cp2.user_id
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN last_msgs lm ON lm.conversation_id = c.id
        LEFT JOIN unread_counts uc ON uc.conversation_id = c.id
        WHERE cp.user_id = $1
        ORDER BY lm.last_message_at DESC NULLS LAST",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn get_or_create_conversation(
    pool: &PgPool,
    user_id: Uuid,
    other_user_id: Uuid,
) -> Result<ConversationResponse, AppError> {
    if user_id == other_user_id {
        return Err(AppError::BadRequest("Cannot start conversation with yourself".into()));
    }

    let existing = sqlx::query_as::<_, ConversationResponse>(
        "SELECT
            c.id,
            u.id AS other_user_id,
            u.username AS other_username,
            p.avatar_url AS other_avatar_url,
            NULL AS last_message,
            NULL::timestamptz AS last_message_at,
            NULL::uuid AS last_message_sender_id,
            0::bigint AS unread_count
        FROM conversation_participants cp1
        JOIN conversation_participants cp2 ON cp2.conversation_id = cp1.conversation_id
        JOIN conversations c ON c.id = cp1.conversation_id
        JOIN users u ON u.id = cp2.user_id
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE cp1.user_id = $1 AND cp2.user_id = $2",
    )
    .bind(user_id)
    .bind(other_user_id)
    .fetch_optional(pool)
    .await?;

    if let Some(conv) = existing {
        return Ok(conv);
    }

    let conv_id = Uuid::new_v4();

    sqlx::query("INSERT INTO conversations (id) VALUES ($1)")
        .bind(conv_id)
        .execute(pool)
        .await?;

    sqlx::query("INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)")
        .bind(conv_id)
        .bind(user_id)
        .bind(other_user_id)
        .execute(pool)
        .await?;

    let other = sqlx::query_as::<_, ConversationResponse>(
        "SELECT
            $1 AS id,
            u.id AS other_user_id,
            u.username AS other_username,
            p.avatar_url AS other_avatar_url,
            NULL AS last_message,
            NULL::timestamptz AS last_message_at,
            NULL::uuid AS last_message_sender_id,
            0::bigint AS unread_count
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = $2",
    )
    .bind(conv_id)
    .bind(other_user_id)
    .fetch_one(pool)
    .await?;

    Ok(other)
}

pub async fn get_messages(
    pool: &PgPool,
    conversation_id: Uuid,
    user_id: Uuid,
    before: Option<DateTime<Utc>>,
) -> Result<Vec<MessageResponse>, AppError> {
    // Verify user is a participant
    let is_participant = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
    )
    .bind(conversation_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if is_participant == 0 {
        return Err(AppError::NotFound("Conversation not found".into()));
    }

    let messages = if let Some(before_ts) = before {
        sqlx::query_as::<_, MessageResponse>(
            "SELECT id, conversation_id, sender_id, content, seen_at, created_at
             FROM messages
             WHERE conversation_id = $1 AND created_at < $2
             ORDER BY created_at DESC
             LIMIT 50",
        )
        .bind(conversation_id)
        .bind(before_ts)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, MessageResponse>(
            "SELECT id, conversation_id, sender_id, content, seen_at, created_at
             FROM messages
             WHERE conversation_id = $1
             ORDER BY created_at DESC
             LIMIT 50",
        )
        .bind(conversation_id)
        .fetch_all(pool)
        .await?
    };

    Ok(messages.into_iter().rev().collect())
}

pub async fn send_message(
    pool: &PgPool,
    conversation_id: Uuid,
    user_id: Uuid,
    body: &SendMessageRequest,
) -> Result<MessageResponse, AppError> {
    let content = body.content.trim();
    if content.is_empty() {
        return Err(AppError::BadRequest("Message cannot be empty".into()));
    }

    let is_participant = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
    )
    .bind(conversation_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if is_participant == 0 {
        return Err(AppError::NotFound("Conversation not found".into()));
    }

    let msg = sqlx::query_as::<_, MessageResponse>(
        "INSERT INTO messages (conversation_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, conversation_id, sender_id, content, seen_at, created_at",
    )
    .bind(conversation_id)
    .bind(user_id)
    .bind(content)
    .fetch_one(pool)
    .await?;

    sqlx::query("UPDATE conversations SET updated_at = NOW() WHERE id = $1")
        .bind(conversation_id)
        .execute(pool)
        .await?;

    Ok(msg)
}

pub async fn mark_read(
    pool: &PgPool,
    conversation_id: Uuid,
    user_id: Uuid,
) -> Result<DateTime<Utc>, AppError> {
    let now = Utc::now();

    sqlx::query(
        "UPDATE messages SET seen_at = $1
         WHERE conversation_id = $2 AND sender_id != $3 AND seen_at IS NULL",
    )
    .bind(now)
    .bind(conversation_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(now)
}

pub async fn get_other_participant_id(
    pool: &PgPool,
    conversation_id: Uuid,
    user_id: Uuid,
) -> Result<Uuid, AppError> {
    let pid = sqlx::query_scalar::<_, Uuid>(
        "SELECT user_id FROM conversation_participants
         WHERE conversation_id = $1 AND user_id != $2",
    )
    .bind(conversation_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    pid.ok_or_else(|| AppError::NotFound("Other participant not found".into()))
}

pub fn notify_participants(
    clients: &ChatWsClients,
    user_id: Uuid,
    payload: &str,
) {
    let map = clients.lock().unwrap();
    if let Some(senders) = map.get(&user_id) {
        for tx in senders {
            let _ = tx.send(payload.to_string());
        }
    }
}
