mod auth;
mod circles;
mod config;
mod db;
mod error;
mod notifications;
mod stories;
mod user;

use actix_web::{web, App, HttpServer, middleware::Logger};
use notifications::ws::WsClients;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init();

    let config = config::AppConfig::from_env();
    let pool = db::db::init_pool(&config).await;
    db::db::run_migrations(&pool).await;

    let redis_client = redis::Client::open(config.redis_url.as_str())
        .expect("Failed to create Redis client");

    let ws_clients: WsClients = notifications::ws::new_ws_clients();

    let bind_addr = format!("{}:{}", config.host, config.port);

    println!("Orbit server starting on {}", bind_addr);

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(redis_client.clone()))
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(ws_clients.clone()))
            .configure(auth::configure_routes)
            .configure(user::configure_routes)
            .configure(circles::configure_routes)
            .configure(stories::configure_routes)
            .configure(notifications::configure_routes)
    })
    .bind(&bind_addr)?
    .run()
    .await
}
