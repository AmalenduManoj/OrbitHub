use actix_web::{HttpResponse, ResponseError};
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Unauthorized(String),
    BadRequest(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            Self::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            Self::NotFound(msg) => write!(f, "Not found: {}", msg),
            Self::Conflict(msg) => write!(f, "Conflict: {}", msg),
            Self::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            Self::Unauthorized(msg) => HttpResponse::Unauthorized().json(serde_json::json!({
                "error": msg
            })),
            Self::BadRequest(msg) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": msg
            })),
            Self::NotFound(msg) => HttpResponse::NotFound().json(serde_json::json!({
                "error": msg
            })),
            Self::Conflict(msg) => HttpResponse::Conflict().json(serde_json::json!({
                "error": msg
            })),
            Self::Internal(msg) => HttpResponse::InternalServerError().json(serde_json::json!({
                "error": msg
            })),
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match &err {
            sqlx::Error::RowNotFound => Self::NotFound("Resource not found".into()),
            sqlx::Error::Database(db_err) if db_err.constraint() == Some("users_username_key") => {
                Self::Conflict("Username already taken".into())
            }
            sqlx::Error::Database(db_err) if db_err.constraint() == Some("users_email_key") => {
                Self::Conflict("Email already taken".into())
            }
            _ => Self::Internal(format!("Database error: {}", err)),
        }
    }
}
