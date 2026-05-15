use crate::Data;
use crate::Error;
use std::collections::BTreeMap;

type Context<'a> = poise::Context<'a, Data, Error>;

/// Show the current round and voting info.
#[poise::command(slash_command)]
pub async fn round(ctx: Context<'_>) -> Result<(), Error> {
    let tournament = &ctx.data().tournament;

    // Group bouts by round number
    let mut rounds: BTreeMap<u8, Vec<_>> = BTreeMap::new();
    for bout in &tournament.bouts {
        rounds.entry(bout.round).or_insert_with(Vec::new).push(bout);
    }

    // Find the current round: the lowest round where at least one bout has no winner
    let current_round = rounds.iter().find(|(_, bouts)| {
        bouts.iter().any(|b| b.winner.is_none())
    }).map(|(r, _)| *r);

    let reply = match current_round {
        Some(round_num) => {
            let bouts = &rounds[&round_num];
            let bout_count = bouts.len();

            // Find min and max voting dates for this round
            let min_date = bouts.iter().map(|b| b.voting_date).min().unwrap();
            let max_date = bouts.iter().map(|b| b.voting_date).max().unwrap();

            format!(
                "**Round {}** is currently active with **{}** bouts. Voting runs **{}** – **{}**.",
                round_num, bout_count, min_date.format("%b %d"), max_date.format("%b %d")
            )
        }
        None => "The tournament is **complete**! All bouts have been decided.".to_string(),
    };

    ctx.say(reply).await?;
    Ok(())
}
