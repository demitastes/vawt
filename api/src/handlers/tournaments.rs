use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::NaiveDate;
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TournamentMeta {
    pub year: u16,
    pub name: String,
    pub start_date: NaiveDate,
    pub bout_count: usize,
}

pub async fn list_tournaments(State(state): State<AppState>) -> Json<Vec<u16>> {
    let mut years: Vec<u16> = state.tournaments.iter().map(|t| t.year).collect();
    years.sort();
    Json(years)
}

pub async fn get_tournament(
    State(state): State<AppState>,
    Path(year): Path<u16>,
) -> Result<Json<TournamentMeta>, StatusCode> {
    state
        .tournaments
        .iter()
        .find(|t| t.year == year)
        .map(|t| {
            Json(TournamentMeta {
                year: t.year,
                name: t.name.clone(),
                start_date: t.start_date,
                bout_count: t.bouts.len(),
            })
        })
        .ok_or(StatusCode::NOT_FOUND)
}
