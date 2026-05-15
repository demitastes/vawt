use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use vawt_common::types::TournamentData;

use crate::state::AppState;

pub async fn get_bracket(
    State(state): State<AppState>,
    Path(year): Path<u16>,
) -> Result<Json<TournamentData>, StatusCode> {
    state
        .tournaments
        .iter()
        .find(|t| t.year == year)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}
