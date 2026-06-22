use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::notifications::models::NotificationResponse;
use crate::notifications::ws::WsClients;

pub async fn create_notification(
    pool: &PgPool,
    user_id: Uuid,
    actor_id: Option<Uuid>,
    notification_type: &str,
    story_id: Option<Uuid>,
    content: &str,
) -> Result<NotificationResponse, AppError> {
    let notification = sqlx::query_as::<_, NotificationResponse>(
        "INSERT INTO notifications (user_id, actor_id, notification_type, story_id, content)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING
           id,
           actor_id,
           (SELECT username FROM users WHERE id = $2) AS actor_username,
           notification_type,
           story_id,
           content,
           is_read,
           created_at",
    )
    .bind(user_id)
    .bind(actor_id)
    .bind(notification_type)
    .bind(story_id)
    .bind(content)
    .fetch_one(pool)
    .await?;

    Ok(notification)
}

pub async fn send_and_broadcast(
    pool: &PgPool,
    ws_clients: &WsClients,
    user_id: Uuid,
    actor_id: Option<Uuid>,
    notification_type: &str,
    story_id: Option<Uuid>,
    content: &str,
) {
    if let Ok(notification) = create_notification(pool, user_id, actor_id, notification_type, story_id, content).await {
        if let Ok(json) = serde_json::to_string(&notification) {
            let clients = ws_clients.lock().unwrap();
            if let Some(senders) = clients.get(&user_id) {
                for sender in senders {
                    let _ = sender.send(json.clone());
                }
            }
        }
    }
}

pub async fn list_notifications(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<NotificationResponse>, AppError> {
    let notifications = sqlx::query_as::<_, NotificationResponse>(
        "SELECT
            n.id,
            n.actor_id,
            u.username AS actor_username,
            n.notification_type,
            n.story_id,
            n.content,
            n.is_read,
            n.created_at
         FROM notifications n
         LEFT JOIN users u ON u.id = n.actor_id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT 50",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(notifications)
}

pub async fn unread_count(pool: &PgPool, user_id: Uuid) -> Result<i64, AppError> {
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(count.0)
}

pub async fn mark_read(pool: &PgPool, notification_id: Uuid, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
    )
    .bind(notification_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn mark_all_read(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false")
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(())
}
