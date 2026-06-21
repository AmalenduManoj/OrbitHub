pub mod handler;
pub mod models;
pub mod service;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/circles")
            .route("", web::post().to(handler::create_circle))
            .route("", web::get().to(handler::list_circles))
            .route("/{id}", web::get().to(handler::get_circle))
            .route("/{id}", web::patch().to(handler::update_circle))
            .route("/{id}", web::delete().to(handler::delete_circle))
            .route("/{id}/members", web::post().to(handler::add_members))
            .route("/{id}/members", web::get().to(handler::list_members))
            .route("/{id}/members/{user_id}", web::delete().to(handler::remove_member)),
    );
}
