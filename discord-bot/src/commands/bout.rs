use crate::Data;
use crate::Error;

type Context<'a> = poise::Context<'a, Data, Error>;

/// Show details for a specific bout.
#[poise::command(slash_command)]
pub async fn bout(ctx: Context<'_>, bout_id: String) -> Result<(), Error> {
    let tournament = &ctx.data().tournament;

    // Find the bout (case-insensitive comparison)
    let bout = tournament
        .bouts
        .iter()
        .find(|b| b.id.eq_ignore_ascii_case(&bout_id));

    let reply = match bout {
        Some(b) => {
            let round = b.round;
            let bout_num = b.bout;
            let voting_date = b.voting_date.format("%B %d").to_string();

            let participants_list = if b.participants.is_empty() {
                "No participants listed".to_string()
            } else {
                b.participants
                    .iter()
                    .map(|p| {
                        if p.flags.is_empty() {
                            p.name.clone()
                        } else {
                            let flags_str = p.flags.join(" ");
                            format!("{} ({})", p.name, flags_str)
                        }
                    })
                    .collect::<Vec<_>>()
                    .join("\n")
            };

            let winner_status = b
                .winner
                .as_ref()
                .map(|w| w.clone())
                .unwrap_or_else(|| "TBD".to_string());

            format!(
                "**Bout Details**\n\
                 **ID:** `{}`\n\
                 **Round {} – Bout {}**\n\n\
                 **Participants:**\n{}\n\n\
                 **Voting Date:** {}\n\
                 **Winner:** {}",
                b.id, round, bout_num, participants_list, voting_date, winner_status
            )
        }
        None => format!(
            "Bout `{}` not found. Use `/help` to see all available commands.",
            bout_id
        ),
    };

    ctx.say(reply).await?;
    Ok(())
}
