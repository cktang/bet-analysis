# Football Data Merger Script

## Overview

This script merges football data from multiple sources to create comprehensive datasets for betting analysis. It combines:

- **FBRef data**: Match statistics (scores, xG, referee, venue, attendance)
- **Match files**: Betting odds and market data from various sources

## Features

- **✅ Unified Records**: Each row contains BOTH FBRef statistics AND betting data for the same match
- **Smart Team Name Matching**: Handles variations in team names across different sources
- **Date-based Matching**: Uses date + home/away team combinations to identify the same match
- **Comprehensive Data**: Combined records include:
  - **FBRef**: scores, xG, referee, venue, attendance, week, time
  - **Match files**: event ID, betting odds (1X2, Over/Under 2.5), alternative scores
- **Quality Control**: Generates unmatched records file for manual review
- **Team Mapping**: Creates a mapping file showing how team names were normalized

## Usage

```bash
node src/scripts/merge-football-data.js <year>
```

### Examples

```bash
# Merge 2024-2025 season data
node src/scripts/merge-football-data.js 2024

# Merge 2023-2024 season data  
node src/scripts/merge-football-data.js 2023

# Available years: 2021, 2022, 2023, 2024
```

## Input Data Sources

### FBRef Data (CSV format)
- Location: `data/raw/fbref/fbref_YYYY_YYYY_data.csv`
- Contains: Match results, xG, referee, venue, attendance
- Format: Standard CSV with headers

### Match Files (Text format)
- Location: `data/raw/matches/YYYY-YYYY/`
- Contains: Betting odds, market data, event IDs
- Format: Structured text files with match details and odds

## Output Files

### 1. Merged Data CSV
- **Location**: `data/processed/merged_YYYY_YYYY_data.csv`
- **Content**: Combined match data with both statistics and betting information
- **Columns Include**:
  - Date, HomeTeam, AwayTeam
  - FTHG, FTAG (Full Time Goals)
  - HomeScore, AwayScore (from match files)
  - EventId (betting system ID)
  - HomeWinOdds, DrawOdds, AwayWinOdds
  - Over2_5Odds, Under2_5Odds
  - Home_xG, Away_xG
  - Referee, Venue, Attendance
  - MatchStatus (merged/fbref-only/match-only)

### 2. Team Mappings CSV
- **Location**: `data/processed/team_mappings_YYYY_YYYY.csv`
- **Content**: Shows how team names were normalized
- **Use**: Review and improve team name matching

### 3. Unmatched Records JSON
- **Location**: `data/processed/merged_YYYY_YYYY_data_unmatched.json`
- **Content**: Records that couldn't be matched between sources
- **Use**: Manual review and quality control

## Match Quality Results

### 2024-2025 Season
- **Successfully merged records**: 79 (unified data)
- **Unmatched FBRef records**: 301 
- **Unmatched match files**: 295
- **Match success rate**: 79 perfect matches from 380 FBRef records (20.8%)

### 2023-2024 Season  
- **Successfully merged records**: 64 (unified data)
- **Unmatched FBRef records**: 316
- **Unmatched match files**: 309
- **Match success rate**: 64 perfect matches from 380 FBRef records (16.8%)

## Data Quality Features

### Team Name Normalization
The script handles common team name variations:
- Manchester Utd ↔ Manchester United ↔ Manchester
- Newcastle Utd ↔ Newcastle
- Brighton ↔ Brighton & Hove Albion
- Wolves ↔ Wolverhampton ↔ Wolverhampton Wanderers
- And many more...

### Date Matching
- **FBRef format**: "2024-08-16"
- **Match file format**: "16/08/2024"
- Automatically converts and matches dates

### Match Identification
Uses combination of:
1. **Date** (normalized to YYYY-MM-DD)
2. **Home team** (normalized name)
3. **Away team** (normalized name)

## Dependencies

```bash
npm install csv-parser csv-writer
```

## File Structure Expected

```
data/
├── raw/
│   ├── fbref/
│   │   ├── fbref_2024_2025_data.csv
│   │   ├── fbref_2023_2024_data.csv
│   │   └── fbref_2022_2023_data.csv
│   └── matches/
│       ├── 2024-2025/
│       │   ├── 20240817-FB9107.txt
│       │   └── ...
│       ├── 2023-2024/
│       └── ...
└── processed/
    ├── merged_2024_2025_data.csv
    ├── team_mappings_2024_2025.csv
    └── merged_2024_2025_data_unmatched.json
```

## Troubleshooting

### Low Match Rates
- Check team name variations in `team_mappings_*.csv`
- Review `*_unmatched.json` for common patterns
- Add new team mappings to `initializeTeamMappings()` function

### Date Mismatches
- Verify date formats in both sources
- Check for timezone or date offset issues

### Missing Files
- Ensure directory structure matches expected format
- Verify file naming conventions (YYYY_YYYY vs YYYY-YYYY)

## Future Improvements

1. **Better Team Matching**: Use fuzzy string matching for team names
2. **Score Validation**: Cross-validate scores between sources
3. **Additional Markets**: Extract more betting markets from match files
4. **Historical Data**: Extend support for older seasons
5. **Manual Review UI**: Create interface for reviewing unmatched records

## Example Usage in Analysis

```javascript
const fs = require('fs');
const csv = require('csv-parser');

// Load merged data for analysis
const matches = [];
fs.createReadStream('data/processed/merged_2024_2025_data.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.MatchStatus === 'merged') {
      matches.push(row);
    }
  })
  .on('end', () => {
    // Now you have clean, merged data for analysis
    console.log(`Loaded ${matches.length} complete matches`);
  });
```

This merged dataset provides a solid foundation for betting analysis, combining accurate match statistics with historical odds data. 