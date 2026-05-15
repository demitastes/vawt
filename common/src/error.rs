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

    #[error("email {0} already registered")]
    DuplicateEmail(String),

    #[error("invalid email or password")]
    InvalidCredentials,

    #[error("invalid email format")]
    InvalidEmail,

    #[error("password must be at least 8 characters")]
    InvalidPassword,

    #[error("JWT error: {0}")]
    JwtError(String),

    #[error("password hashing error")]
    PasswordHashError,
}
