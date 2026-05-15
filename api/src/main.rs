mod state;
mod router;
mod handlers;

use std::sync::Arc;
use vawt_common::types::TournamentData;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("DATA_DIR").unwrap_or_else(|_| "data".to_string());
    let tournaments = load_all_tournaments(&data_dir)
        .expect("failed to load tournament data");
    let state = state::AppState {
        tournaments: Arc::new(tournaments),
        user_store: Arc::new(tokio::sync::RwLock::new(std::collections::HashMap::new())),
    };

    let app = router::build_router(state);
    let port = std::env::var("API_PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("failed to bind listener");
    tracing::info!("listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}

fn load_all_tournaments(data_dir: &str) -> Result<Vec<TournamentData>, Box<dyn std::error::Error>> {
    let mut tournaments = Vec::new();
    let dir = std::fs::read_dir(data_dir)?;

    for entry in dir {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() && path.file_name().map_or(false, |n| {
            n.to_string_lossy().starts_with("bracket-") && n.to_string_lossy().ends_with(".json")
        }) {
            let content = std::fs::read_to_string(&path)?;
            let data: TournamentData = serde_json::from_str(&content)?;
            tournaments.push(data);
        }
    }

    tournaments.sort_by_key(|t| t.year);
    Ok(tournaments)
}
