# Football Data Processing Pipeline

This directory contains scripts for automating the complete football data processing workflow.

## 🚀 Quick Start

```bash
# Process current season (2024-2025)
./scripts/process-football-data.sh 2024

# Update team mappings and process all seasons
./scripts/process-football-data.sh -u -a

# Process specific seasons with verbose output
./scripts/process-football-data.sh -v 2023 2024
```

## 📁 Scripts Overview

### `process-football-data.sh` (Main Pipeline)
Comprehensive shell script that automates the entire data processing workflow:
- **Team mapping updates** (optional)
- **Data validation and preprocessing**
- **FBRef and match data merging**
- **JSON output generation**

### `process-all-fbref-incidents.sh` (FBRef Data Processing)
Processes FBRef match pages to identify "clean" matches for predictive modeling:
- **Incident extraction** from FBRef match pages
- **Match cleanliness scoring** (penalties, red cards, etc.)
- **Rate-limited requests** to respect FBRef servers
- **Organized output** into clean/incidents/failed directories

### `resume-fbref-processing.sh` (Recovery Tool)
Recovery script for resuming interrupted FBRef processing:
- **Conservative rate limiting** (8s delay) to avoid 429 errors
- **Smart progress detection** from previous runs
- **Automatic retry logic** for failed matches

### Supporting Node.js Scripts
- `src/scripts/update-team-mapping.js` - Discovers and updates team name mappings
- `src/scripts/merge-football-data-json.js` - Merges FBRef and match data into JSON
- `src/scripts/analyze-missing-matches.js` - Analyzes data quality and missing matches
- `src/scripts/process-fbref-season.js` - Core FBRef season processing engine
- `src/scripts/parse-fbref-match-incidents.js` - Single match incident parser

## 🛠️ Usage

### Basic Commands

```bash
# Show help
./scripts/process-football-data.sh --help

# Process single season
./scripts/process-football-data.sh 2024

# Process multiple seasons
./scripts/process-football-data.sh 2022 2023 2024

# Process all available seasons
./scripts/process-football-data.sh -a
```

### Advanced Options

```bash
# Update team mappings before processing
./scripts/process-football-data.sh -u 2024

# Force overwrite existing files
./scripts/process-football-data.sh -f 2023 2024

# Enable verbose output for debugging
./scripts/process-football-data.sh -v 2024

# Combine all options
./scripts/process-football-data.sh -u -f -v -a
```

## 📊 Data Sources

The pipeline processes data from two main sources:

### FBRef Data
- **Location**: `data/raw/fbref/YYYY-YYYY/fbref_YYYY_YYYY_data.csv`
- **Contains**: Match statistics, scores, xG, referee, venue, attendance
- **Format**: CSV with standardized column names

### Match Files  
- **Location**: `data/raw/matches/YYYY-YYYY/*.txt`
- **Contains**: Betting odds, event IDs, market data
- **Format**: Individual text files per match

### Team Mapping
- **Location**: `data/raw/team-mapping.csv`
- **Purpose**: Normalizes team name variations between data sources
- **Updated**: Automatically when using `-u` flag

## 📄 Output Format

The pipeline generates JSON files with hierarchical structure:

```json
{
  "metadata": {
    "totalMatches": 373,
    "matchesWithFBRef": 373,
    "generatedAt": "2024-06-21T18:19:21.339Z"
  },
  "matches": {
    "Manchester Utd v Liverpool": {
      "match": {
        "eventId": "FB1234",
        "homeTeam": "Manchester Utd",
        "awayTeam": "Liverpool",
        "homeScore": 2,
        "awayScore": 1,
        "homeWinOdds": 2.1,
        "drawOdds": 3.4,
        "awayWinOdds": 2.8
      },
      "fbref": {
        "homeGoals": 2,
        "awayGoals": 1,
        "homeXG": 1.8,
        "awayXG": 1.2,
        "referee": "Michael Oliver",
        "venue": "Old Trafford",
        "attendance": 73500
      }
    }
  }
}
```

## 🔧 Configuration

### Available Seasons
- **2022**: 2022-2023 season
- **2023**: 2023-2024 season  
- **2024**: 2024-2025 season

### Prerequisites
- **Node.js** (v14+ recommended)
- **npm packages**: `csv-parser`, `csv-writer` (auto-installed)
- **Data directories**: `data/raw/matches/`, `data/raw/fbref/`

## 📈 Quality Metrics

The pipeline tracks data quality metrics:

| Season | Total Matches | With FBRef | Success Rate |
|--------|---------------|------------|--------------|
| 2022-2023 | 380 | 380 | 100% |
| 2023-2024 | 373 | 373 | 100% |
| 2024-2025 | 373 | 373 | 100% |

## 🐛 Troubleshooting

### Common Issues

**Missing Node.js packages**
```bash
npm install csv-parser csv-writer
```

**Team name mapping issues**
```bash
# Update team mappings
./scripts/process-football-data.sh -u 2024

# Analyze missing matches
node src/scripts/analyze-missing-matches.js
```

**Data directory not found**
```bash
# Ensure data structure exists
ls -la data/raw/matches/
ls -la data/raw/fbref/
```

### Log Files
- Team mapping updates: `/tmp/team-mapping-update.log`
- Processing logs: `/tmp/process-YEAR.log`

## 🔄 Workflow

1. **Data Collection**: Raw FBRef CSV and match text files
2. **Team Mapping Update**: Discover and normalize team name variations  
3. **Data Validation**: Check prerequisites and data integrity
4. **Processing**: Merge data sources using team/date matching
5. **Output Generation**: Create structured JSON with metadata
6. **Quality Report**: Show success rates and file locations

## 📝 Examples

### New Season Processing
```bash
# When new season data is available
./scripts/process-football-data.sh -u 2025
```

### Data Quality Check
```bash
# Update mappings and reprocess with verbose output
./scripts/process-football-data.sh -u -v -f 2023
```

### Batch Processing
```bash
# Process all seasons after major data update
./scripts/process-football-data.sh -u -f -a
```

## 🎯 FBRef Match Incident Processing

### Quick Start
```bash
# Process all seasons for incident analysis
./scripts/process-all-fbref-incidents.sh

# Resume interrupted processing with conservative rate limiting
./scripts/resume-fbref-processing.sh

# Process specific year manually
node src/scripts/process-fbref-incidents.js 2024
```

### Rate Limiting & 429 Errors
FBRef has strict rate limits. If you encounter HTTP 429 "Too Many Requests" errors:

1. **Use the resume script**: `./scripts/resume-fbref-processing.sh` (8s delay)
2. **Manual processing**: `node src/scripts/process-fbref-season.js 2024 --delay 10000`
3. **Be patient**: ~380 matches × 8s = 50+ minutes per season

### Output Structure
```
data/raw/fbref/
├── 2022/
│   ├── clean/              # Matches ideal for predictive modeling
│   ├── incidents/          # Matches with penalties/red cards
│   ├── failed/             # Matches that couldn't be processed
│   ├── processing-summary.json
│   └── README.md
├── 2023/ [same structure]
├── 2024/ [same structure]
└── master-summary.json     # Overall statistics
```

### Match Cleanliness Categories
- **clean**: No significant incidents (Score: 0) - ideal for modeling
- **minor_incidents**: Few yellow cards (Score: 1-2) - use with caution  
- **moderate_incidents**: Some disruption (Score: 3-5) - questionable for modeling
- **major_incidents**: Penalties/red cards (Score: 6+) - avoid for modeling

### Processing Time Estimates
- **Standard processing**: ~15 minutes per season (5s delay)
- **Conservative processing**: ~50 minutes per season (8s delay)
- **Manual processing**: Configurable delay (10s+ recommended)

## 🤝 Contributing

When adding support for new seasons:
1. Add year to `AVAILABLE_SEASONS` array in the shell script
2. Update `get_season_string()` function
3. Ensure data directories follow naming convention
4. Test with team mapping updates

---

For issues or questions, run with `-v` flag for detailed logging. 