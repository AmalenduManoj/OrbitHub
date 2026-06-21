use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;

use crate::config::AppConfig;

pub async fn init_pool(config: &AppConfig) -> PgPool {
    let connect_options: PgConnectOptions = config
        .database_url
        .parse::<PgConnectOptions>()
        .expect("Failed to parse DATABASE_URL")
        .statement_cache_capacity(0);

    PgPoolOptions::new()
        .max_connections(10)
        .connect_with(connect_options)
        .await
        .expect("Failed to create database pool")
}

pub async fn run_migrations(pool: &PgPool) {
    match sqlx::migrate!("./migrations").run(pool).await {
        Ok(_) => println!("Migrations applied successfully"),
        Err(e) => eprintln!("Warning: Migration skipped (tables may already exist): {}", e),
    }
}
