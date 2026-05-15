mod commands;
mod data;
mod api;

use poise::serenity_prelude as serenity;
use vawt_common::types::TournamentData;

pub type Error = Box<dyn std::error::Error + Send + Sync>;
pub type Context<'a> = poise::Context<'a, Data, Error>;

pub struct Data {
    pub tournament: TournamentData,
    pub api: Option<api::ApiClient>,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let token = std::env::var("DISCORD_TOKEN").expect("DISCORD_TOKEN not set");
    let data_dir = std::env::var("DATA_DIR").unwrap_or_else(|_| "data".to_string());
    let tournament = data::load_tournament(&data_dir, 2026)
        .expect("failed to load bracket");

    let api_client = match (
        std::env::var("VAWT_API_BASE_URL").ok(),
        std::env::var("VAWT_SERVICE_KEY").ok(),
    ) {
        (Some(base_url), Some(service_key)) => {
            tracing::info!("API client configured: {}", base_url);
            Some(api::ApiClient::new(base_url, service_key))
        }
        _ => {
            tracing::warn!("VAWT_API_BASE_URL or VAWT_SERVICE_KEY not set; voting will be unavailable");
            None
        }
    };

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![
                commands::round::round(),
                commands::voting_dates::voting_dates(),
                commands::bout::bout(),
                commands::standings::standings(),
                commands::help::help(),
                commands::vote::vote(),
            ],
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                Ok(Data {
                    tournament,
                    api: api_client,
                })
            })
        })
        .build();

    let mut client = serenity::ClientBuilder::new(
        token,
        serenity::GatewayIntents::non_privileged(),
    )
    .framework(framework)
    .await
    .expect("error creating client");

    client.start().await.expect("error starting client");
}
