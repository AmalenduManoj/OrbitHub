use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::AppError;
use crate::user::models::ProfileUpdateRequest;
use crate::user::service;

pub async fn get_user(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();
    let user = service::get_user_profile(pool.get_ref(), user_id).await?;
    Ok(HttpResponse::Ok().json(user))
}

pub async fn update_profile(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    body: web::Json<ProfileUpdateRequest>,
) -> Result<HttpResponse, AppError> {
    let user = service::update_profile(pool.get_ref(), auth_user.user_id, &body).await?;
    Ok(HttpResponse::Ok().json(user))
}

pub async fn follow(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let followed_id = path.into_inner();
    service::follow_user(pool.get_ref(), auth_user.user_id, followed_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Followed successfully"})))
}

pub async fn unfollow(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let followed_id = path.into_inner();
    service::unfollow_user(pool.get_ref(), auth_user.user_id, followed_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Unfollowed successfully"})))
}
