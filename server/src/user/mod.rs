pub mod handler;
pub mod models;
pub mod service;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/user")
            .route("/search", web::get().to(handler::search))
            .route("/{id}", web::get().to(handler::get_user))
            .route("/profile", web::patch().to(handler::update_profile))
            .route("/{id}/follow", web::post().to(handler::follow))
            .route("/{id}/follow", web::delete().to(handler::unfollow)),
    );
}
