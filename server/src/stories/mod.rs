pub mod handler;
pub mod models;
pub mod service;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/stories")
            .route("", web::post().to(handler::create_story))
            .route("/feed", web::get().to(handler::feed))
            .route("/{id}", web::get().to(handler::get_story))
            .route("/{id}", web::delete().to(handler::delete_story))
            .route("/{id}/view", web::post().to(handler::view_story))
            .route("/{id}/views", web::get().to(handler::get_views))
            .route("/{id}/like", web::post().to(handler::toggle_like))
            .route("/{id}/likes", web::get().to(handler::get_likes))
            .route("/{id}/comments", web::post().to(handler::add_comment))
            .route("/{id}/comments", web::get().to(handler::get_comments))
            .route("/{id}/comments/{comment_id}", web::delete().to(handler::delete_comment)),
    );
    cfg.service(
        web::scope("/highlights")
            .route("", web::post().to(handler::create_highlight))
            .route("", web::get().to(handler::list_highlights))
            .route("/{id}", web::get().to(handler::get_highlight))
            .route("/{id}", web::delete().to(handler::delete_highlight))
            .route("/{id}/stories", web::post().to(handler::add_to_highlight))
            .route("/{id}/stories/{story_id}", web::delete().to(handler::remove_from_highlight)),
    );
}
