use std::future::Ready;

use actix_web::{dev::Payload, web, FromRequest, HttpRequest};
use uuid::Uuid;

use crate::auth::service::verify_token;
use crate::config::AppConfig;
use crate::error::AppError;

pub struct AuthenticatedUser {
    pub user_id: Uuid,
}

impl FromRequest for AuthenticatedUser {
    type Error = AppError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let auth_header = req
            .headers()
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .map(|v| v.to_string());

        let Some(token) = auth_header else {
            return std::future::ready(Err(AppError::Unauthorized(
                "Missing or invalid Authorization header".into(),
            )));
        };

        let config = req
            .app_data::<web::Data<AppConfig>>()
            .expect("AppConfig not found");

        let claims = match verify_token(&token, config) {
            Ok(c) => c,
            Err(e) => return std::future::ready(Err(e)),
        };

        let user_id = match Uuid::parse_str(&claims.sub) {
            Ok(id) => id,
            Err(_) => {
                return std::future::ready(Err(AppError::Unauthorized(
                    "Invalid token payload".into(),
                )))
            }
        };

        std::future::ready(Ok(Self { user_id }))
    }
}
