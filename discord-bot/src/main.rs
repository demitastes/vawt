mod commands;
mod data;

use poise::serenity_prelude as serenity;
use vawt_common::types::TournamentData;

pub type Error = Box<dyn std::error::Error + Send + Sync>;
pub type Context<'a> = poise::Context<'a, Data, Error>;

pub struct Data {
    pub tournament: TournamentData,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let token = std::env::var("DISCORD_TOKEN").expect("DISCORD_TOKEN not set");
    let data_dir = std::env::var("DATA_DIR").unwrap_or_else(|_| "data".to_string());
    let tournament = data::load_tournament(&data_dir, 2026)
        .expect("failed to load bracket");

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![
                commands::round::round(),
                commands::voting_dates::voting_dates(),
            ],
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                Ok(Data { tournament })
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
