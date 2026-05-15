use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::RwLock;
use vawt_common::types::{TournamentData, UserRecord};

#[derive(Clone)]
pub struct AppState {
    pub tournaments: Arc<Vec<TournamentData>>,
    pub user_store: Arc<RwLock<HashMap<String, UserRecord>>>,
}
