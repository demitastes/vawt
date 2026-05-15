use thiserror::Error;

#[derive(Debug, Error)]
pub enum VawtError {
    #[error("tournament year {0} not found")]
    TournamentNotFound(u16),

    #[error("bout {0} not found")]
    BoutNotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),
}
