use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use bcrypt::{hash, verify, DEFAULT_COST};
use regex::Regex;
use uuid::Uuid;
use lazy_static::lazy_static;
use vawt_common::types::{RegisterRequest, LoginRequest, AuthResponse, UserRecord, JwtClaims};
use crate::state::AppState;

lazy_static! {
    static ref EMAIL_REGEX: Regex = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    static ref JWT_SECRET: String = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "default-secret-key-change-in-production".to_string());
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Validate email format
    if !EMAIL_REGEX.is_match(&payload.email) {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Validate password length
    if payload.password.len() < 8 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let mut user_store = state.user_store.write().await;

    // Check if email already exists
    if user_store.values().any(|u| u.email == payload.email) {
        return Err(StatusCode::CONFLICT);
    }

    // Hash password
    let password_hash = hash(&payload.password, DEFAULT_COST)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Create user record
    let user_id = Uuid::new_v4().to_string();
    let user = UserRecord {
        id: user_id.clone(),
        email: payload.email.clone(),
        password_hash,
    };

    user_store.insert(user_id.clone(), user);

    // Generate JWT token
    let now = Utc::now();
    let claims = JwtClaims {
        sub: user_id.clone(),
        email: payload.email.clone(),
        exp: (now + chrono::Duration::hours(24)).timestamp() as u64,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_ref()),
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse {
        user_id,
        email: payload.email,
        token,
    }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    let user_store = state.user_store.read().await;

    // Find user by email
    let user = user_store
        .values()
        .find(|u| u.email == payload.email)
        .ok_or(StatusCode::BAD_REQUEST)?;

    // Verify password
    let password_valid = verify(&payload.password, &user.password_hash)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    if !password_valid {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Generate JWT token
    let now = Utc::now();
    let claims = JwtClaims {
        sub: user.id.clone(),
        email: user.email.clone(),
        exp: (now + chrono::Duration::hours(24)).timestamp() as u64,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_ref()),
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse {
        user_id: user.id.clone(),
        email: user.email.clone(),
        token,
    }))
}
