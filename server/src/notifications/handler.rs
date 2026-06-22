use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::AppError;
use crate::notifications::service;

pub async fn list_notifications(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let notifications = service::list_notifications(pool.get_ref(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(notifications))
}

pub async fn unread_count(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let count = service::unread_count(pool.get_ref(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"count": count})))
}

pub async fn mark_read(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    service::mark_read(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Marked as read"})))
}

pub async fn mark_all_read(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    service::mark_all_read(pool.get_ref(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "All marked as read"})))
}
