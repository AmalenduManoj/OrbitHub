use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::models::*;
use crate::auth::service;
use crate::config::AppConfig;
use crate::error::AppError;

pub async fn register(
    pool: web::Data<PgPool>,
    redis: web::Data<redis::Client>,
    config: web::Data<AppConfig>,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    if body.username.len() < 3 || body.password.len() < 6 {
        return Err(AppError::BadRequest(
            "Username must be at least 3 characters and password at least 6 characters".into(),
        ));
    }

    let hash = service::hash_password(&body.password)?;

    let mut tx = pool.begin().await?;

    let user = sqlx::query_as::<_, AuthUserResponse>(
        "INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, NULL as bio, NULL as avatar_url, NULL as gender, created_at",
    )
    .bind(&body.username)
    .bind(&body.email)
    .bind(&hash)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query(
        "INSERT INTO profiles (user_id, bio, avatar_url, gender) VALUES ($1, $2, $3, $4)",
    )
    .bind(user.id)
    .bind(&body.bio)
    .bind(&body.avatar_url)
    .bind(&body.gender)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let access_token = service::issue_access_token(&user.id, &config)?;
    let refresh_token = service::issue_refresh_token(&user.id, &config)?;

    store_refresh_token(redis.get_ref(), &refresh_token, &user.id).await?;

    Ok(HttpResponse::Created().json(AuthResponse {
        access_token,
        refresh_token,
        user,
    }))
}

pub async fn login(
    pool: web::Data<PgPool>,
    redis: web::Data<redis::Client>,
    config: web::Data<AppConfig>,
    body: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    let user = sqlx::query_as::<_, UserWithPassword>(
        "SELECT u.id, u.username, u.email, u.password_hash, p.bio, p.avatar_url, p.gender, u.created_at
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.email = $1 OR u.username = $1",
    )
    .bind(&body.credential)
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid credentials".into()))?;

    let valid = service::verify_password(&body.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized("Invalid credentials".into()));
    }

    let access_token = service::issue_access_token(&user.id, &config)?;
    let refresh_token = service::issue_refresh_token(&user.id, &config)?;

    store_refresh_token(redis.get_ref(), &refresh_token, &user.id).await?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token,
        user: AuthUserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            avatar_url: user.avatar_url,
            gender: user.gender,
            created_at: user.created_at,
        },
    }))
}

pub async fn refresh(
    redis: web::Data<redis::Client>,
    config: web::Data<AppConfig>,
    body: web::Json<RefreshRequest>,
) -> Result<HttpResponse, AppError> {
    let claims = service::verify_token(&body.refresh_token, &config)?;
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid token payload".into()))?;

    let mut redis_conn = redis
        .get_multiplexed_tokio_connection()
        .await
        .map_err(|e| AppError::Internal(format!("Redis error: {}", e)))?;

    let key = format!("refresh_token:{}", body.refresh_token);
    let exists: Option<String> = redis::cmd("GET")
        .arg(&key)
        .query_async(&mut redis_conn)
        .await
        .map_err(|_| AppError::Unauthorized("Invalid refresh token".into()))?;

    if exists.is_none() {
        return Err(AppError::Unauthorized("Refresh token revoked or expired".into()));
    }

    redis::cmd("DEL")
        .arg(&key)
        .query_async::<_, ()>(&mut redis_conn)
        .await
        .ok();

    let access_token = service::issue_access_token(&user_id, &config)?;
    let refresh_token = service::issue_refresh_token(&user_id, &config)?;

    drop(redis_conn);
    store_refresh_token(redis.get_ref(), &refresh_token, &user_id).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "access_token": access_token,
        "refresh_token": refresh_token,
    })))
}

async fn store_refresh_token(
    redis: &redis::Client,
    refresh_token: &str,
    user_id: &Uuid,
) -> Result<(), AppError> {
    let mut conn = redis
        .get_multiplexed_tokio_connection()
        .await
        .map_err(|e| AppError::Internal(format!("Redis error: {}", e)))?;

    let key = format!("refresh_token:{}", refresh_token);
    redis::cmd("SET")
        .arg(&key)
        .arg(user_id.to_string())
        .arg("EX")
        .arg(604800i64)
        .query_async::<_, ()>(&mut conn)
        .await
        .map_err(|e| AppError::Internal(format!("Redis error: {}", e)))?;

    Ok(())
}

#[derive(sqlx::FromRow)]
struct UserWithPassword {
    id: Uuid,
    username: String,
    email: String,
    password_hash: String,
    bio: Option<String>,
    avatar_url: Option<String>,
    gender: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}
