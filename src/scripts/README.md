# Data Processing Scripts

This directory contains all scripts for processing raw football data into enhanced datasets ready for betting analysis. The scripts handle the complete pipeline from raw match files and FBRef data to fully enhanced datasets with comprehensive metrics.

## 🎯 **When to Use These Scripts**

### ✅ **Use When:**
- Adding NEW season data (2025-2026, etc.)
- Integrating NEW data sources (additional leagues, markets)
- Updating team mappings for new teams
- Processing additional FBRef incident data

### ❌ **Don't Use When:**
- Data is already processed and working (current seasons 2022-2025)
- Trying to "fix" existing enhanced datasets
- The analysis system is already working with current data
- You want to regenerate existing profitable strategies

### 📊 **Current Status:**
- **✅ COMPLETE**: All 3 seasons (2022-2025) processed and enhanced
- **✅ VALIDATED**: 1,126 matches with 298 FBRef integrations
- **✅ OPERATIONAL**: Enhanced datasets ready for analysis

## 🚀 Quick Start

```bash
# Process all seasons
cd src/scripts
node merge-football-data-json.js 2022
node merge-football-data-json.js 2023
node merge-football-data-json.js 2024

# Enhance with FBRef incident data  
node enhance-asian-handicap.js ../../data/processed/year-2022-2023.json ../../data/enhanced/year-2022-2023-enhanced.json
node enhance-asian-handicap.js ../../data/processed/year-2023-2024.json ../../data/enhanced/year-2023-2024-enhanced.json
node enhance-asian-handicap.js ../../data/processed/year-2024-2025.json ../../data/enhanced/year-2024-2025-enhanced.json
```

## 📁 Script Organization

### Core Data Processing
- **`merge-football-data-json.js`** - Main data processing engine
- **`enhance-asian-handicap.js`** - FBRef integration and metric calculation
- **`process-football-data.sh`** - Automated pipeline orchestration

### FBRef Processing  
- **`process-all-fbref-incidents.sh`** - Batch FBRef data extraction
- **`parse-fbref-match-incidents.js`** - Individual match incident parsing
- **`process-fbref-season.js`** - Season-level FBRef processing
- **`resume-fbref-processing.sh`** - Recovery script for interrupted processing

### Data Utilities
- **`update-team-mapping.js`** - Team name mapping discovery and updates
- **`analyze-missing-matches.js`** - Data quality analysis and gap identification
- **`merge-football-data.js`** - Legacy CSV merger (deprecated)
- **`data-collection-summary.js`** - Processing statistics and summaries

### Legacy/Specialized
- **`scrape-all-data.js`** - Data collection automation
- **`hkjc.result.parser.js`** - HKJC-specific data parsing

## 🔄 Data Processing Pipeline

### Stage 1: Raw Data → Processed Data
**Script**: `merge-football-data-json.js`

```bash
node merge-football-data-json.js <year>
# Example: node merge-football-data-json.js 2024
```

**Input**:
- `data/raw/matches/YYYY-YYYY/*.txt` - Betting odds and market data
- `data/raw/fbref/YYYY-YYYY/fbref_YYYY_YYYY_data.csv` - Match statistics
- `data/raw/team-mapping.csv` - Team name normalization

**Output**: 
- `data/processed/year-YYYY-YYYY.json` - Complete match data with timeSeries

**Features**:
- ✅ Team name normalization across data sources
- ✅ Complete timeSeries analysis for all teams
- ✅ Asian Handicap betting outcome calculations
- ✅ Market efficiency metrics
- ✅ Pre-match and post-match analytics

### Stage 2: Processed Data → Enhanced Data
**Script**: `enhance-asian-handicap.js`

```bash
node enhance-asian-handicap.js <input_file> <output_file>
```

**Input**:
- Processed JSON file from Stage 1
- `data/raw/fbref/` - FBRef incident data (all seasons)

**Output**:
- `data/enhanced/year-YYYY-YYYY-enhanced.json` - Fully enhanced dataset

**Features**:
- ✅ FBRef incident data integration
- ✅ 8 new FBRef-based metrics
- ✅ Smart team name matching
- ✅ Match cleanliness scoring
- ✅ Enhanced version tracking (v2.0)

## 📊 Data Flow Diagram

```
Raw Match Files (*.txt)     FBRef Data (*.csv)     Team Mapping
        ↓                          ↓                    ↓
        └──────────── merge-football-data-json.js ──────┘
                                   ↓
                    data/processed/year-YYYY-YYYY.json
                                   ↓
              enhance-asian-handicap.js ← FBRef Incidents
                                   ↓
                   data/enhanced/year-YYYY-YYYY-enhanced.json
                                   ↓
                        [Ready for Analysis]
```

## 🛠️ Script Details

### merge-football-data-json.js
**Purpose**: Main data processing engine that combines all raw data sources

**Key Features**:
- **Team Mapping**: Intelligent team name normalization
- **TimeSeries Generation**: Complete performance tracking for all teams
- **Market Analysis**: Asian Handicap outcome calculations
- **Data Validation**: Comprehensive quality checks

**Usage**:
```bash
node merge-football-data-json.js 2024
```

**Output Statistics** (typical):
- Total matches: 373-380 per season
- Teams with time-series data: 20 (all Premier League teams)
- Processing time: ~10-30 seconds per season

### enhance-asian-handicap.js
**Purpose**: Integrates FBRef incident data and calculates advanced metrics

**Key Features**:
- **FBRef Integration**: Loads incident data from all seasons
- **Smart Matching**: Team name normalization for incident data
- **New Metrics**: 8 FBRef-based metrics (cleanliness, discipline, timing, etc.)
- **Version Tracking**: Upgrades data to v2.0 with enhanced features

**Usage**:
```bash
node enhance-asian-handicap.js input.json output.json
```

**New Metrics Added**:
- `matchCleanliness` - Impact of penalties, red cards, controversial decisions
- `cardDiscipline` - Team discipline based on yellow/red card patterns
- `penaltyImpact` - Penalty frequency and conversion analysis
- `goalTiming` - When goals are scored (early/late game patterns)
- `substitutionPatterns` - Tactical substitution analysis
- `incidentDensity` - Overall match incident frequency
- `matchIntensity` - Combined measure of match competitiveness

### FBRef Processing Scripts

#### process-all-fbref-incidents.sh
**Purpose**: Batch processing of FBRef match pages

**Features**:
- Rate-limited requests (respects FBRef servers)
- Organized output (clean/incidents/failed directories)
- Progress tracking and resume capability
- Error handling and retry logic

#### parse-fbref-match-incidents.js  
**Purpose**: Extracts incident data from individual FBRef match pages

**Extracted Data**:
- Goals and timing
- Cards (yellow/red) and timing
- Penalties and outcomes
- Substitutions and timing
- Match officials
- Attendance and venue

#### process-fbref-season.js
**Purpose**: Season-level coordination of FBRef processing

**Features**:
- Season-specific file organization
- Batch processing coordination
- Error aggregation and reporting

## 📈 Data Quality Metrics

### Processing Success Rates
- **2022-2023**: 380 matches processed, 106 with FBRef data (28%)
- **2023-2024**: 373 matches processed, 80 with FBRef data (21%)
- **2024-2025**: 373 matches processed, 112 with FBRef data (30%)

### Data Completeness
- ✅ **100%** match data coverage (all EPL matches)
- ✅ **100%** timeSeries data (all 20 teams per season)
- ✅ **26%** enhanced with detailed FBRef incidents
- ✅ **0%** data quality issues (fixed 2022-2023 problems)

### Enhancement Statistics
- **Total Matches Enhanced**: 1,126
- **FBRef Matches Integrated**: 298
- **New Metrics Added**: 8 per enhanced match
- **Processing Time**: ~30-60 seconds per season

## 🔧 Configuration

### Team Mapping
The `data/raw/team-mapping.csv` file handles team name variations:
```csv
Arsenal,Arsenal
Manchester United,Manchester Utd
Tottenham Hotspur,Tottenham
```

### Season Format
- **Input year**: 2024 (represents 2024-2025 season)
- **File naming**: `year-2024-2025.json`
- **Directory structure**: `2024-2025/` for raw files

### FBRef Integration
- **Auto-loading**: Enhancement script loads all available FBRef data
- **Smart matching**: Handles team name variations automatically
- **Graceful degradation**: Works with or without FBRef data

## 🚨 Troubleshooting

### Common Issues

#### "Team mapping file not found"
```bash
# Ensure you're running from project root
cd /path/to/bet-analysis
node src/scripts/merge-football-data-json.js 2024
```

#### "No FBRef data found"
```bash
# Check FBRef directory structure
ls data/raw/fbref/2024-2025/
# Should contain *.json files from FBRef processing
```

#### "TimeSeries incomplete"
- This was fixed in the 2022-2023 data reprocessing
- Rerun the merge script if issues persist

### Performance Optimization
- **Memory**: Scripts use ~100-200MB RAM
- **Storage**: Enhanced files are ~4MB per season
- **Network**: FBRef processing respects rate limits
- **Parallel Processing**: Not implemented (single-threaded)

## 📋 Maintenance

### Regular Tasks
1. **Update team mappings** when new teams enter the league
2. **Reprocess seasons** if raw data is updated
3. **Monitor FBRef coverage** and run incident processing for new matches
4. **Validate data quality** using analyze-missing-matches.js

### Version Control
- **Enhanced data version**: Currently v2.0
- **Backward compatibility**: v1.0 data can be upgraded
- **Schema evolution**: New metrics added without breaking existing data

## 🔮 Future Enhancements

### Planned Features
1. **Real-time processing** for live match data
2. **Additional metrics** from FBRef data
3. **Parallel processing** for faster batch operations
4. **Data validation dashboard** for quality monitoring

### Extension Points
1. **New data sources** can be integrated into merge script
2. **Additional leagues** with minimal configuration changes  
3. **Custom metrics** can be added to enhancement pipeline
4. **Export formats** (CSV, database) can be added

---

*These scripts form the backbone of the betting analysis system, ensuring high-quality, comprehensive datasets for strategy discovery and validation.* 