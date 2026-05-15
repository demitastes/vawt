use vawt_common::types::TournamentData;

pub fn load_tournament(data_dir: &str, year: u16) -> Result<TournamentData, Box<dyn std::error::Error>> {
    let path = std::path::Path::new(data_dir).join(format!("bracket-{}.json", year));
    let content = std::fs::read_to_string(&path)?;
    let data: TournamentData = serde_json::from_str(&content)?;
    Ok(data)
}
