use std::sync::Arc;
use vawt_common::types::TournamentData;

#[derive(Clone)]
pub struct AppState {
    pub tournaments: Arc<Vec<TournamentData>>,
}
