pub mod handler;
pub mod middleware;
pub mod models;
pub mod service;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/register", web::post().to(handler::register))
            .route("/login", web::post().to(handler::login))
            .route("/refresh", web::post().to(handler::refresh)),
    );
}
