use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::AppError;
use crate::stories::models::*;
use crate::stories::service;

pub async fn create_story(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    body: web::Json<CreateStoryRequest>,
) -> Result<HttpResponse, AppError> {
    let story = service::create_story(pool.get_ref(), auth_user.user_id, &body).await?;
    Ok(HttpResponse::Created().json(story))
}

pub async fn feed(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let stories = service::feed(pool.get_ref(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(stories))
}

pub async fn get_story(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let story = service::get_story(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(story))
}

pub async fn delete_story(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    service::delete_story(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Story deleted"})))
}

pub async fn view_story(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    service::view_story(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "View registered"})))
}

pub async fn get_views(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let viewers = service::get_views(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(viewers))
}

pub async fn toggle_like(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let liked = service::toggle_like(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"liked": liked})))
}

pub async fn get_likes(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let likes = service::get_likes(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(likes))
}

pub async fn add_comment(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
    body: web::Json<AddCommentRequest>,
) -> Result<HttpResponse, AppError> {
    let comment =
        service::add_comment(pool.get_ref(), path.into_inner(), auth_user.user_id, &body.content).await?;
    Ok(HttpResponse::Created().json(comment))
}

pub async fn get_comments(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let comments =
        service::get_comments(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(comments))
}

pub async fn delete_comment(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse, AppError> {
    let (story_id, comment_id) = path.into_inner();
    service::delete_comment(pool.get_ref(), story_id, comment_id, auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Comment deleted"})))
}

pub async fn create_highlight(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    body: web::Json<CreateHighlightRequest>,
) -> Result<HttpResponse, AppError> {
    let highlight =
        service::create_highlight(pool.get_ref(), auth_user.user_id, &body.name, body.cover_story_id).await?;
    Ok(HttpResponse::Created().json(highlight))
}

pub async fn list_highlights(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let highlights = service::list_highlights(pool.get_ref(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(highlights))
}

pub async fn get_highlight(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let (highlight, stories) =
        service::get_highlight(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "highlight": highlight,
        "stories": stories
    })))
}

pub async fn delete_highlight(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    service::delete_highlight(pool.get_ref(), path.into_inner(), auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Highlight deleted"})))
}

pub async fn add_to_highlight(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<Uuid>,
    body: web::Json<AddStoryToHighlightRequest>,
) -> Result<HttpResponse, AppError> {
    service::add_story_to_highlight(pool.get_ref(), path.into_inner(), body.story_id, auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Story added to highlight"})))
}

pub async fn remove_from_highlight(
    pool: web::Data<PgPool>,
    auth_user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse, AppError> {
    let (highlight_id, story_id) = path.into_inner();
    service::remove_story_from_highlight(pool.get_ref(), highlight_id, story_id, auth_user.user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"message": "Story removed from highlight"})))
}
