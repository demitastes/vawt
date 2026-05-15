use axum::{routing::{get, post}, Router};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::handlers::{health, tournaments, bracket, rounds, bouts, users};
use crate::state::AppState;

pub fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health::get_health))
        .route("/api/tournaments", get(tournaments::list_tournaments))
        .route("/api/tournaments/{year}", get(tournaments::get_tournament))
        .route("/api/tournaments/{year}/bracket", get(bracket::get_bracket))
        .route("/api/tournaments/{year}/rounds", get(rounds::get_rounds))
        .route("/api/tournaments/{year}/bouts/{id}", get(bouts::get_bout))
        .route("/api/users/register", post(users::register))
        .route("/api/users/login", post(users::login))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
