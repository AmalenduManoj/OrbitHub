pub mod handler;
pub mod models;
pub mod service;
pub mod ws;

use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/chat")
            .route("/conversations", web::get().to(handler::list_conversations))
            .route("/conversations", web::post().to(handler::create_conversation))
            .route("/conversations/{id}/messages", web::get().to(handler::get_messages))
            .route("/conversations/{id}/messages", web::post().to(handler::send_message))
            .route("/conversations/{id}/read", web::post().to(handler::mark_read)),
    );
    cfg.route("/ws/chat", web::get().to(ws::ws_handler));
}
