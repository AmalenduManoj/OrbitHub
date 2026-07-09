use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::chat::models::{CreateConversationRequest, MessageQuery, SendMessageRequest};
use crate::chat::service;
use crate::chat::ws::ChatWsClients;
use crate::error::AppError;

pub async fn list_conversations(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let conversations = service::list_conversations(pool.get_ref(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(conversations))
}

pub async fn create_conversation(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    body: web::Json<CreateConversationRequest>,
) -> Result<HttpResponse, AppError> {
    let conv = service::get_or_create_conversation(pool.get_ref(), auth_user.user_id, body.user_id).await?;
    Ok(HttpResponse::Ok().json(conv))
}

pub async fn get_messages(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
    query: web::Query<MessageQuery>,
) -> Result<HttpResponse, AppError> {
    let messages = service::get_messages(
        pool.get_ref(),
        path.into_inner(),
        auth_user.user_id,
        query.before,
    )
    .await?;
    Ok(HttpResponse::Ok().json(messages))
}

pub async fn send_message(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    clients: web::Data<ChatWsClients>,
    path: web::Path<Uuid>,
    body: web::Json<SendMessageRequest>,
) -> Result<HttpResponse, AppError> {
    let conversation_id = path.into_inner();
    let msg = service::send_message(pool.get_ref(), conversation_id, auth_user.user_id, &body).await?;

    // Push to other participant via WS
    if let Ok(other_id) = service::get_other_participant_id(pool.get_ref(), conversation_id, auth_user.user_id).await {
        let payload = serde_json::json!({
            "type": "new_message",
            "message": msg,
        });
        service::notify_participants(clients.get_ref(), other_id, &payload.to_string());
    }

    Ok(HttpResponse::Created().json(msg))
}

pub async fn mark_read(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    clients: web::Data<ChatWsClients>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let conversation_id = path.into_inner();
    let seen_at = service::mark_read(pool.get_ref(), conversation_id, auth_user.user_id).await?;

    // Notify the other participant that messages were read
    if let Ok(other_id) = service::get_other_participant_id(pool.get_ref(), conversation_id, auth_user.user_id).await {
        let payload = serde_json::json!({
            "type": "messages_read",
            "conversation_id": conversation_id,
            "seen_at": seen_at,
        });
        service::notify_participants(clients.get_ref(), other_id, &payload.to_string());
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({"seen_at": seen_at})))
}
