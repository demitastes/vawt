use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct VoteRequest {
    pub distillery_id: String,
    pub discord_id: String,
    pub source: String,  // always "discord"
    pub source_ref: String,
}

#[derive(Deserialize)]
pub struct VoteResponse {
    // The actual response structure is not yet documented, but assume it returns something
    // that indicates success. For now, if the response status is 200, assume success.
}

pub enum VoteResult {
    Success { distillery_id: String },
    AlreadyVoted { distillery_id: String },
    Error(String),
}

pub struct ApiClient {
    client: reqwest::Client,
    base_url: String,
    service_key: String,
}

impl ApiClient {
    pub fn new(base_url: String, service_key: String) -> Self {
        ApiClient {
            client: reqwest::Client::new(),
            base_url,
            service_key,
        }
    }

    pub async fn cast_vote(
        &self,
        year: u16,
        bout_id: &str,
        distillery_id: &str,
        discord_id: u64,
        source_ref: u64,
    ) -> Result<VoteResult, String> {
        let url = format!(
            "{}/api/tournaments/{}/bouts/{}/vote",
            self.base_url, year, bout_id
        );

        let request_body = VoteRequest {
            distillery_id: distillery_id.to_string(),
            discord_id: discord_id.to_string(),
            source: "discord".to_string(),
            source_ref: source_ref.to_string(),
        };

        let response = self
            .client
            .post(&url)
            .header("X-Service-Key", &self.service_key)
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        match response.status().as_u16() {
            200 => Ok(VoteResult::Success {
                distillery_id: distillery_id.to_string(),
            }),
            409 => Ok(VoteResult::AlreadyVoted {
                distillery_id: distillery_id.to_string(),
            }),
            status => Err(format!("Vote failed with status {}", status)),
        }
    }
}
