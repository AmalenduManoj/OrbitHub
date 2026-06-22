pub mod handler;
pub mod models;
pub mod service;
pub mod ws;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/notifications")
            .route("", web::get().to(handler::list_notifications))
            .route("/unread-count", web::get().to(handler::unread_count))
            .route("/{id}/read", web::post().to(handler::mark_read))
            .route("/read-all", web::post().to(handler::mark_all_read)),
    );
    cfg.route("/ws/notifications", web::get().to(ws::ws_handler));
}
