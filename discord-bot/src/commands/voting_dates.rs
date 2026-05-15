use crate::Data;
use crate::Error;
use std::collections::BTreeMap;

type Context<'a> = poise::Context<'a, Data, Error>;

/// List all upcoming voting dates by round.
#[poise::command(slash_command)]
pub async fn voting_dates(ctx: Context<'_>) -> Result<(), Error> {
    let tournament = &ctx.data().tournament;

    // Group bouts by round number
    let mut rounds: BTreeMap<u8, Vec<_>> = BTreeMap::new();
    for bout in &tournament.bouts {
        rounds.entry(bout.round).or_insert_with(Vec::new).push(bout);
    }

    // Build the voting schedule
    let mut lines = vec!["**Voting Schedule**".to_string()];
    for (round_num, bouts) in rounds {
        let voting_start = bouts.iter().map(|b| b.voting_date).min().unwrap();
        let voting_end = bouts.iter().map(|b| b.voting_date).max().unwrap();
        lines.push(format!(
            "**Round {}**: {} – {}",
            round_num,
            voting_start.format("%b %d"),
            voting_end.format("%b %d")
        ));
    }

    let msg = lines.join("\n");
    ctx.say(msg).await?;
    Ok(())
}
