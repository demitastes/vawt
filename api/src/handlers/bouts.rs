use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use vawt_common::types::Bout;

use crate::state::AppState;

pub async fn get_bout(
    State(state): State<AppState>,
    Path((year, id)): Path<(u16, String)>,
) -> Result<Json<Bout>, StatusCode> {
    state
        .tournaments
        .iter()
        .find(|t| t.year == year)
        .and_then(|t| t.bouts.iter().find(|b| b.id == id))
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}
