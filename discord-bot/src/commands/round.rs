use crate::Data;
use crate::Error;

type Context<'a> = poise::Context<'a, Data, Error>;

/// Show the current round and voting info.
#[poise::command(slash_command)]
pub async fn round(ctx: Context<'_>) -> Result<(), Error> {
    ctx.say("**Round 1** is currently active. Voting runs May 18 – Jun 21 2026. (stub)")
        .await?;
    Ok(())
}
