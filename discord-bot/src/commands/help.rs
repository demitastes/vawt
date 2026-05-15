use crate::Data;
use crate::Error;

type Context<'a> = poise::Context<'a, Data, Error>;

/// Show all available commands and their descriptions.
#[poise::command(slash_command)]
pub async fn help(ctx: Context<'_>) -> Result<(), Error> {
    let msg = "**VAWT Discord Bot Commands**\n\n\
               `/round` — Show current round and voting dates\n\
               `/voting-dates` — List all upcoming voting dates by round\n\
               `/bout <bout_id>` — Show details for a specific bout\n\
               `/standings` — Show tournament bracket status (completed vs pending)\n\
               `/help` — Show this help message\n\n\
               *Coming soon:*\n\
               `/vote <bout_id> <distillery_id>` — Cast a vote in a bout";
    ctx.say(msg).await?;
    Ok(())
}
