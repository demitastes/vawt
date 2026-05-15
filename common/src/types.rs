use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TournamentData {
    pub year: u16,
    pub name: String,
    pub start_date: NaiveDate,
    pub bouts: Vec<Bout>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Bout {
    pub id: String,
    pub round: u8,
    pub bout: u8,
    pub side: Side,
    pub participants: Vec<Participant>,
    pub feeders: Vec<String>,
    pub winner: Option<String>,
    pub voting_date: NaiveDate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Participant {
    pub name: String,
    pub flags: Vec<String>,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Side {
    Left,
    Right,
    Center,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoundSummary {
    pub round: u8,
    pub bout_count: usize,
    pub voting_start: NaiveDate,
    pub voting_end: NaiveDate,
    pub bouts: Vec<Bout>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TournamentMeta {
    pub year: u16,
    pub name: String,
    pub start_date: NaiveDate,
    pub bout_count: usize,
}

// User authentication types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    #[serde(rename = "userId")]
    pub user_id: String,
    pub email: String,
    pub token: String,
}

#[derive(Debug, Clone)]
pub struct UserRecord {
    pub id: String,
    pub email: String,
    pub password_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,           // user_id
    pub email: String,
    pub exp: u64,              // expiration timestamp
}
