# OddsPortal Parser - Year-Specific Processing

## Overview
The OddsPortal parser now supports year-specific processing for better data organization and analysis.

## Usage

### Basic Usage (Current Year)
```bash
node scrap-oddsportal.result.parser.js
```
- Uses current year (2025) as default
- Input: `data/raw/oddsportal/oddsportal-result-2025.txt` (or falls back to default)
- Output: `data/raw/oddsportal/oddsportal-parsed-2025.json`

### Specific Year Processing
```bash
node scrap-oddsportal.result.parser.js 2023
```
- Input: `data/raw/oddsportal/oddsportal-result-2023.txt`
- Output: `data/raw/oddsportal/oddsportal-parsed-2023.json`
- Only includes matches from 2023

### Multiple Years
```bash
# Process data for different years
node scrap-oddsportal.result.parser.js 2022
node scrap-oddsportal.result.parser.js 2023
node scrap-oddsportal.result.parser.js 2024
```

## File Structure
```
data/raw/oddsportal/
├── oddsportal-result.txt                    # Original scraped data
├── oddsportal-result-2023.txt               # Year-specific raw data
├── oddsportal-parsed-2023.json              # Year-specific parsed data
└── oddsportal-parsed-2024.json              # Another year's data
```

## Features
- ✅ **Year Filtering**: Only processes matches from specified year
- ✅ **Fallback Logic**: Uses default file if year-specific file doesn't exist
- ✅ **Automatic File Copy**: Creates year-specific files when needed
- ✅ **Data Validation**: Filters out matches from wrong years

## Example Output (2023 Data)
- **400 matches** from 2023 season
- **File size**: ~93KB JSON
- **Date range**: April 2023 - May 2023 (season end)

## Data Quality
Each match includes:
- Date and time
- Home/Away teams
- Home/Draw/Away odds (HAD)
- Unique match ID

Perfect for betting analysis by specific seasons! 