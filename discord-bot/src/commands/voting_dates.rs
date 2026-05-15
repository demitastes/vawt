use crate::Data;
use crate::Error;

type Context<'a> = poise::Context<'a, Data, Error>;

/// List all upcoming voting dates by round.
#[poise::command(slash_command)]
pub async fn voting_dates(ctx: Context<'_>) -> Result<(), Error> {
    let msg = "**Voting Schedule (stub)**\n\
               Round 1: May 18 – Jun 21\n\
               Round 2: Jun 22 – Jul 26\n\
               Round 3: Jul 27 – Aug 9\n\
               Round 4: Aug 10 – Aug 16\n\
               Final:   Aug 17";
    ctx.say(msg).await?;
    Ok(())
}
