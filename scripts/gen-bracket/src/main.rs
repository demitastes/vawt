use chrono::NaiveDate;
use std::path::Path;
use vawt_common::types::{Bout, Participant, Side, TournamentData};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let bracket_path = "data/BRACKET.md";
    let output_path = "data/bracket-2026.json";

    if !Path::new(bracket_path).exists() {
        eprintln!("Error: {} not found", bracket_path);
        std::process::exit(1);
    }

    let content = std::fs::read_to_string(bracket_path)?;
    let mut bouts = parse_bouts(&content)?;

    // Add empty bouts for rounds 2-5
    add_derived_rounds(&mut bouts);

    compute_feeders(&mut bouts);
    compute_voting_dates(&mut bouts);
    add_veteran_owned_flags(&mut bouts);

    let tournament = TournamentData {
        year: 2026,
        name: "Virginia Whiskey Tournament 2026".to_string(),
        start_date: NaiveDate::from_ymd_opt(2026, 5, 18).unwrap(),
        bouts,
    };

    let json = serde_json::to_string_pretty(&tournament)?;
    std::fs::write(output_path, json)?;
    println!("Generated {}", output_path);
    Ok(())
}

fn parse_bouts(content: &str) -> Result<Vec<Bout>, Box<dyn std::error::Error>> {
    let mut bouts = Vec::new();
    let mut current_bout: Option<(u8, u8)> = None;
    let mut current_participants: Vec<String> = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();

        // Stop parsing at section headers (lines starting with #)
        if trimmed.starts_with("#") {
            if let Some((round, bout)) = current_bout {
                if !current_participants.is_empty() {
                    bouts.push(make_bout(round, bout, current_participants.clone())?);
                    current_participants.clear();
                }
            }
            current_bout = None;
            continue;
        }

        // Match bout headers: "Round 1 Bout 1 Bracket:" or "R1 B3:"
        if let Some(bout_info) = parse_bout_header(trimmed) {
            if let Some((round, bout)) = current_bout {
                if !current_participants.is_empty() {
                    bouts.push(make_bout(round, bout, current_participants.clone())?);
                    current_participants.clear();
                }
            }
            current_bout = Some(bout_info);
        } else if trimmed.starts_with("- ") && current_bout.is_some() {
            // Only parse as participant if it looks like a distillery name
            // Skip lines that are clearly notes/metadata
            let name = trimmed[2..].trim();
            if !name.contains("encoded in") && !name.contains("status") {
                let name = extract_name_and_notes(name).0;
                current_participants.push(name.to_string());
            }
        }
    }

    // Don't forget the last bout
    if let Some((round, bout)) = current_bout {
        if !current_participants.is_empty() {
            bouts.push(make_bout(round, bout, current_participants)?);
        }
    }

    Ok(bouts)
}

fn parse_bout_header(line: &str) -> Option<(u8, u8)> {
    let trimmed = line.trim();

    // Try "Round X Bout Y Bracket:" or "Round X Bout Y:" format
    if trimmed.starts_with("Round ") && trimmed.contains("Bout ") {
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() >= 4 {
            if let (Ok(round), Ok(bout)) = (parts[1].parse::<u8>(), parts[3].parse::<u8>()) {
                return Some((round, bout));
            }
        }
    }

    // Try "R1 B3:" format (with space between R and B)
    if trimmed.starts_with("R") && trimmed.contains("B") && trimmed.ends_with(":") {
        let parts: Vec<&str> = trimmed.trim_end_matches(':').split_whitespace().collect();
        if parts.len() >= 2 {
            if let (Ok(round), Ok(bout)) = (
                parts[0].trim_start_matches('R').parse::<u8>(),
                parts[1].trim_start_matches('B').parse::<u8>(),
            ) {
                return Some((round, bout));
            }
        }
    }

    None
}

fn extract_name_and_notes(s: &str) -> (String, String) {
    // Handle " - notes" or ": notes" suffixes
    if let Some(pos) = s.find(" - ") {
        let name = s[..pos].trim();
        let notes = s[pos + 3..].trim();
        (name.to_string(), notes.to_string())
    } else if let Some(pos) = s.find(": ") {
        let name = s[..pos].trim();
        let notes = s[pos + 2..].trim();
        (name.to_string(), notes.to_string())
    } else if let Some(pos) = s.find(" (") {
        let name = s[..pos].trim();
        let notes = s[pos + 2..].trim_end_matches(')');
        (name.to_string(), notes.to_string())
    } else {
        (s.to_string(), String::new())
    }
}

fn make_bout(
    round: u8,
    bout: u8,
    names: Vec<String>,
) -> Result<Bout, Box<dyn std::error::Error>> {
    let side = if bout % 2 == 1 { Side::Left } else { Side::Right };

    let participants = names
        .into_iter()
        .map(|name| {
            let (clean_name, notes) = extract_name_and_notes(&name);
            Participant {
                name: clean_name,
                flags: Vec::new(),
                notes,
            }
        })
        .collect();

    Ok(Bout {
        id: format!("r{}b{}", round, bout),
        round,
        bout,
        side,
        participants,
        feeders: Vec::new(), // Will be computed later
        winner: None,
        voting_date: NaiveDate::from_ymd_opt(2026, 1, 1).unwrap(), // Will be computed later
    })
}

fn add_derived_rounds(bouts: &mut Vec<Bout>) {
    // Generate empty bouts for rounds 2-5 (participants filled by winner logic later)
    for round in 2..=5 {
        for bout_num in 1..=get_bout_count(round) {
            let bout_id = format!("r{}b{}", round, bout_num);
            if !bouts.iter().any(|b| b.id == bout_id) {
                let side = if bout_num % 2 == 1 { Side::Left } else { Side::Right };
                bouts.push(Bout {
                    id: bout_id,
                    round,
                    bout: bout_num,
                    side,
                    participants: Vec::new(),
                    feeders: Vec::new(),
                    winner: None,
                    voting_date: NaiveDate::from_ymd_opt(2026, 1, 1).unwrap(),
                });
            }
        }
    }
    // Sort by round and bout number
    bouts.sort_by(|a, b| {
        if a.round == b.round {
            a.bout.cmp(&b.bout)
        } else {
            a.round.cmp(&b.round)
        }
    });
}

fn compute_feeders(bouts: &mut [Bout]) {
    for bout in bouts.iter_mut() {
        if bout.round == 1 {
            bout.feeders = Vec::new();
        } else if bout.round == 5 {
            bout.feeders = vec!["r4b1".to_string(), "r4b2".to_string()];
        } else {
            // For round N, bout B: feeders from round N-1
            // R2B1 feeds from R1B1 and R1B3, R2B2 from R1B2 and R1B4, etc.
            // Pattern: bout B feeds from bouts 2B-1 and 2B in previous round (0-indexed pairs)
            let b = bout.bout as i32;
            let first_feeder = (2 * b - 1) as u8;
            let second_feeder = (2 * b) as u8;
            bout.feeders = vec![
                format!("r{}b{}", bout.round - 1, first_feeder),
                format!("r{}b{}", bout.round - 1, second_feeder),
            ];
        }
    }
}

fn compute_voting_dates(bouts: &mut [Bout]) {
    let start_date = NaiveDate::from_ymd_opt(2026, 5, 18).unwrap();
    let mut bout_sequence = 1;

    for round in 1..=5 {
        for bout_num in 1..=get_bout_count(round) {
            if let Some(bout) = bouts.iter_mut().find(|b| b.round == round && b.bout == bout_num) {
                bout.voting_date = start_date + chrono::Duration::days((bout_sequence - 1) as i64 * 7);
                bout_sequence += 1;
            }
        }
    }
}

fn get_bout_count(round: u8) -> u8 {
    match round {
        1 => 16,
        2 => 8,
        3 => 4,
        4 => 2,
        5 => 1,
        _ => 0,
    }
}

fn add_veteran_owned_flags(bouts: &mut [Bout]) {
    let veteran_owned_names = vec![
        "KO Distilling",
        "Mean Spirits Distilling",
        "Ironclad",
    ];

    for bout in bouts.iter_mut() {
        for participant in &mut bout.participants {
            if veteran_owned_names.contains(&participant.name.as_str()) {
                participant.flags.push("veteran-owned".to_string());
            }
        }
    }
}
