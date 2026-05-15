use crate::Data;
use crate::Error;
use std::collections::BTreeMap;

type Context<'a> = poise::Context<'a, Data, Error>;

/// Show tournament bracket status (completed vs pending).
#[poise::command(slash_command)]
pub async fn standings(ctx: Context<'_>) -> Result<(), Error> {
    let tournament = &ctx.data().tournament;

    // Group bouts by round number
    let mut rounds: BTreeMap<u8, Vec<_>> = BTreeMap::new();
    for bout in &tournament.bouts {
        rounds.entry(bout.round).or_insert_with(Vec::new).push(bout);
    }

    let mut reply = String::from("**Tournament Standings**\n\n");

    for (round_num, bouts) in rounds.iter() {
        let completed = bouts.iter().filter(|b| b.winner.is_some()).count();
        let total = bouts.len();

        reply.push_str(&format!("**Round {}** ({}/{} completed)\n", round_num, completed, total));

        // Completed bouts
        for bout in bouts.iter().filter(|b| b.winner.is_some()) {
            if let Some(winner) = &bout.winner {
                reply.push_str(&format!("{}: **{}** defeats\n", bout.id, winner));
            }
        }

        // Incomplete bouts
        let incomplete: Vec<_> = bouts.iter().filter(|b| b.winner.is_none()).collect();
        if !incomplete.is_empty() {
            reply.push_str("*Pending:*\n");
            for bout in incomplete {
                let participants = bout
                    .participants
                    .iter()
                    .map(|p| p.name.as_str())
                    .collect::<Vec<_>>()
                    .join(" vs ");
                reply.push_str(&format!("{}: {}\n", bout.id, participants));
            }
        }

        reply.push('\n');
    }

    ctx.say(reply).await?;
    Ok(())
}
