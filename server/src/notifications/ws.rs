use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use actix_web::{web, HttpRequest, HttpResponse};
use actix_ws::Message;
use futures_util::StreamExt;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::auth::service::verify_token;
use crate::config::AppConfig;

pub type WsClients = Arc<Mutex<HashMap<Uuid, Vec<mpsc::UnboundedSender<String>>>>>;

pub fn new_ws_clients() -> WsClients {
    Arc::new(Mutex::new(HashMap::new()))
}

pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    config: web::Data<AppConfig>,
    clients: web::Data<WsClients>,
) -> Result<HttpResponse, actix_web::Error> {
    let query = req.query_string();
    let token = query
        .split('&')
        .find(|p| p.starts_with("token="))
        .and_then(|p| p.strip_prefix("token="));

    let Some(token) = token else {
        return Ok(HttpResponse::Unauthorized().json(serde_json::json!({"error": "Missing token"})));
    };

    let claims = match verify_token(token, config.get_ref()) {
        Ok(c) => c,
        Err(_) => {
            return Ok(
                HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid token"})),
            )
        }
    };

    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => {
            return Ok(
                HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid token"})),
            )
        }
    };

    let (response, mut session, mut msg_stream) = actix_ws::handle(&req, stream)?;

    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    {
        let mut map = clients.lock().unwrap();
        map.entry(user_id).or_default().push(tx);
    }

    let clients_clone = clients.clone();
    let user_id_clone = user_id;

    actix_web::rt::spawn(async move {
        let heartbeat = tokio::time::interval(std::time::Duration::from_secs(30));
        tokio::pin!(heartbeat);

        loop {
            tokio::select! {
                Some(msg) = rx.recv() => {
                    if session.text(msg).await.is_err() {
                        break;
                    }
                }
                Some(Ok(msg)) = msg_stream.next() => {
                    match msg {
                        Message::Ping(bytes) => {
                            let _ = session.pong(&bytes).await;
                        }
                        Message::Close(_) => break,
                        _ => {}
                    }
                }
                _ = heartbeat.tick() => {
                    if session.ping(b"").await.is_err() {
                        break;
                    }
                }
                else => break,
            }
        }

        let mut map = clients_clone.lock().unwrap();
        if let Some(senders) = map.get_mut(&user_id_clone) {
            senders.retain(|s| !s.is_closed());
            if senders.is_empty() {
                map.remove(&user_id_clone);
            }
        }
    });

    Ok(response)
}
