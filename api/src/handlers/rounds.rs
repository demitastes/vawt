use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use vawt_common::types::RoundSummary;

use crate::state::AppState;

pub async fn get_rounds(
    State(state): State<AppState>,
    Path(year): Path<u16>,
) -> Result<Json<Vec<RoundSummary>>, StatusCode> {
    let tournament = state
        .tournaments
        .iter()
        .find(|t| t.year == year)
        .ok_or(StatusCode::NOT_FOUND)?;

    let mut rounds = Vec::new();
    for round_num in 1..=5 {
        let bouts: Vec<_> = tournament
            .bouts
            .iter()
            .filter(|b| b.round == round_num)
            .cloned()
            .collect();

        if bouts.is_empty() {
            continue;
        }

        let voting_dates: Vec<_> = bouts.iter().map(|b| b.voting_date).collect();
        let voting_start = *voting_dates.iter().min().unwrap_or(&bouts[0].voting_date);
        let voting_end = *voting_dates.iter().max().unwrap_or(&bouts[0].voting_date);

        rounds.push(RoundSummary {
            round: round_num,
            bout_count: bouts.len(),
            voting_start,
            voting_end,
            bouts,
        });
    }

    Ok(Json(rounds))
}
