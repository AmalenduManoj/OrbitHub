use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::circles::models::*;
use crate::circles::service;
use crate::error::AppError;

pub async fn create_circle(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    body: web::Json<CreateCircleRequest>,
) -> Result<HttpResponse, AppError> {
    let circle = service::create_circle(pool.get_ref(), auth_user.user_id, &body.name).await?;
    Ok(HttpResponse::Created().json(circle))
}

pub async fn list_circles(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let circles = service::list_circles(pool.get_ref(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(circles))
}

pub async fn get_circle(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let circle_id = path.into_inner();
    let circle = service::get_circle(pool.get_ref(), circle_id, auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(circle))
}

pub async fn update_circle(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
    body: web::Json<UpdateCircleRequest>,
) -> Result<HttpResponse, AppError> {
    let circle_id = path.into_inner();
    let circle =
        service::update_circle(pool.get_ref(), circle_id, auth_user.user_id, &body.name).await?;
    Ok(HttpResponse::Ok().json(circle))
}

pub async fn delete_circle(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let circle_id = path.into_inner();
    service::delete_circle(pool.get_ref(), circle_id, auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Circle deleted"})))
}

pub async fn add_members(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
    body: web::Json<AddMembersRequest>,
) -> Result<HttpResponse, AppError> {
    let circle_id = path.into_inner();
    service::add_members(pool.get_ref(), circle_id, auth_user.user_id, &body.user_ids).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Members added"})))
}

pub async fn list_members(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let circle_id = path.into_inner();
    let members = service::list_members(pool.get_ref(), circle_id, auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(members))
}

pub async fn remove_member(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse, AppError> {
    let (circle_id, user_id) = path.into_inner();
    service::remove_member(pool.get_ref(), circle_id, auth_user.user_id, user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Member removed"})))
}
