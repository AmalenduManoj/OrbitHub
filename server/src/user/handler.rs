use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::AppError;
use crate::notifications::service as notification_service;
use crate::notifications::ws::WsClients;
use crate::user::models::{ProfileUpdateRequest, SearchQuery};
use crate::user::service;

pub async fn get_followers(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();
    let users = service::get_followers(pool.get_ref(), user_id).await?;
    Ok(HttpResponse::Ok().json(users))
}

pub async fn get_following(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();
    let users = service::get_following(pool.get_ref(), user_id).await?;
    Ok(HttpResponse::Ok().json(users))
}

pub async fn search(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
) -> Result<HttpResponse, AppError> {
    let q = query.into_inner().q;
    if q.trim().is_empty() {
        return Ok(HttpResponse::Ok().json(Vec::<serde_json::Value>::new()));
    }
    let users = service::search_users(pool.get_ref(), &q).await?;
    Ok(HttpResponse::Ok().json(users))
}

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
    ws_clients: web::Data<WsClients>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let followed_id = path.into_inner();
    service::follow_user(pool.get_ref(), auth_user.user_id, followed_id).await?;

    let actor_username: String = sqlx::query_scalar("SELECT username FROM users WHERE id = $1")
        .bind(auth_user.user_id)
        .fetch_one(pool.get_ref())
        .await?;

    notification_service::send_and_broadcast(
        pool.get_ref(),
        ws_clients.get_ref(),
        followed_id,
        Some(auth_user.user_id),
        "follow",
        None,
        &format!("{} started following you", actor_username),
    )
    .await;

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
