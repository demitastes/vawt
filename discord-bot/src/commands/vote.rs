use crate::api::VoteResult;
use crate::{Context, Error};

/// Cast your vote in a bout.
#[poise::command(slash_command)]
pub async fn vote(
    ctx: Context<'_>,
    bout_id: String,
    distillery_id: String,
) -> Result<(), Error> {
    // Defer the interaction response since HTTP calls may take time
    ctx.defer_ephemeral().await?;

    // Get the discord user ID from the context
    let discord_id = ctx.author().id.get();

    // Generate a unique source_ref from timestamp and user ID
    let source_ref = chrono::Local::now().timestamp_millis() as u64;

    // Get the API client from context data
    let api = match &ctx.data().api {
        Some(api) => api,
        None => {
            ctx.say("Voting is not configured on this bot instance.").await?;
            return Ok(());
        }
    };

    let year = ctx.data().tournament.year;

    // Call the API to cast the vote
    match api
        .cast_vote(year, &bout_id, &distillery_id, discord_id, source_ref)
        .await
    {
        Ok(VoteResult::Success { distillery_id }) => {
            ctx.say(format!(
                "✅ Your vote for **{}** in bout **{}** has been recorded!",
                distillery_id, bout_id
            ))
            .await?;
        }
        Ok(VoteResult::AlreadyVoted { distillery_id }) => {
            ctx.say(format!(
                "⚠️ You have already voted for **{}** in bout **{}**.",
                distillery_id, bout_id
            ))
            .await?;
        }
        Ok(VoteResult::Error(e)) => {
            ctx.say(format!("❌ Vote failed: {}", e))
                .await?;
        }
        Err(e) => {
            ctx.say(format!("❌ Request failed: {}", e))
                .await?;
        }
    }

    Ok(())
}
