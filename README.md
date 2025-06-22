# Football Betting Analysis System

A comprehensive data-driven system for discovering profitable football betting strategies using Premier League data from 2022-2025. The system combines match statistics, betting odds, and detailed incident analysis to identify market inefficiencies in Asian Handicap betting.

## 🤖 **NEW AGENTS: READ THIS FIRST**
**📖 [NEW_AGENT_GUIDE.md](NEW_AGENT_GUIDE.md)** - Essential reading for anyone new to this project. Explains what's already done, what not to modify, and where to contribute safely.

## 🎯 Project Overview

This system has successfully identified **20 profitable betting strategies** with documented returns ranging from 3% to 61% ROI across 1,126 Premier League matches spanning three seasons.

### Key Achievements
- ✅ **Complete data pipeline** processing 3 seasons of EPL data (2022-2025)
- ✅ **Enhanced datasets** with FBRef incident integration (298/1,126 matches)
- ✅ **20 winning strategies** with real extracted betting records
- ✅ **Comprehensive analysis framework** using machine learning techniques
- ✅ **Fixed data quality issues** ensuring reliable backtesting

## 📁 Project Structure

```
bet-analysis/
├── data/
│   ├── raw/                    # Raw data sources
│   │   ├── matches/           # Betting odds and market data by season
│   │   ├── fbref/            # FBRef match incident data
│   │   └── team-mapping.csv  # Team name normalization
│   ├── processed/            # Processed match data with enhancements
│   └── enhanced/            # Final enhanced datasets with FBRef integration
├── src/
│   ├── scripts/            # Data processing and enhancement scripts
│   │   ├── merge-football-data-json.js    # Main data processing
│   │   ├── enhance-asian-handicap.js      # Data enhancement
│   │   └── process-*.sh                   # Shell automation scripts
│   ├── ah-analysis/       # Asian Handicap analysis system (CLEAN)
│   │   ├── ah_combination_generator.js    # Factor combination generation
│   │   ├── ah_combination_tester.js       # Statistical testing engine
│   │   ├── run_feedback_loop.js          # Adaptive learning orchestration
│   │   ├── rule_loader.js                # Rule management system
│   │   ├── extract_actual_betting_records.js  # Betting record extraction
│   │   ├── rules/                        # Factor definitions (12 files)
│   │   └── winning_strategies_records_REAL/   # Final betting records (42 files)
│   └── parsers/          # Data parsing utilities
├── plan/                 # Strategic planning documents
└── docs/                # Project documentation
```

## 🚀 Quick Start

### 1. Data Processing Pipeline

```bash
# Process all seasons and generate enhanced datasets
cd src/scripts
node merge-football-data-json.js 2022
node merge-football-data-json.js 2023  
node merge-football-data-json.js 2024

# Enhance with FBRef incident data
node enhance-asian-handicap.js ../data/processed/year-2022-2023.json ../data/enhanced/year-2022-2023-enhanced.json
node enhance-asian-handicap.js ../data/processed/year-2023-2024.json ../data/enhanced/year-2023-2024-enhanced.json
node enhance-asian-handicap.js ../data/processed/year-2024-2025.json ../data/enhanced/year-2024-2025-enhanced.json
```

### 2. Access Winning Strategies

```bash
# View extracted betting records
ls src/ah-analysis/winning_strategies_records_REAL/
cat src/ah-analysis/winning_strategies_records_REAL/_MASTER_SUMMARY.json
```

## 📊 Data Overview

### Raw Data Sources
- **Match Files**: `data/raw/matches/` - Betting odds, handicap lines, market data
- **FBRef Data**: `data/raw/fbref/` - Match incidents, cards, penalties, substitutions  
- **Team Mapping**: `data/raw/team-mapping.csv` - Normalized team names across sources

### Processed Data
- **Season Files**: `data/processed/year-YYYY-YYYY.json` - Complete match data with timeSeries
- **Enhanced Files**: `data/enhanced/year-YYYY-YYYY-enhanced.json` - With FBRef incident analysis

### Data Quality
- **Total Matches**: 1,126 across 3 seasons
- **Complete Data**: All seasons have full timeSeries analysis for all 20 Premier League teams
- **FBRef Coverage**: 298 matches (26%) include detailed incident data
- **Data Integrity**: Fixed 2022-2023 incomplete processing issue

## 🎲 Winning Strategies

The system has identified 20 profitable betting strategies with real performance data:

### Top Performing Strategies
1. **Single_awayGoalDiff** - 17.73% profit (222 bets)
2. **European_Pressure** - 15.42% profit (65 bets) 
3. **Single_homeFormLength** - 14.89% profit (47 bets)
4. **Single_awayTopSix** - 14.44% profit (90 bets)
5. **Single_awayFormLength** - 13.83% profit (47 bets)

### Strategy Categories
- **Form-based**: Team performance streaks and momentum
- **Positional**: League table position and pressure situations
- **Market efficiency**: Odds vs actual team strength discrepancies
- **Contextual**: Season timing, European competition effects

### Betting Records
All strategies include:
- ✅ **Real match data** with actual team names and scores
- ✅ **Detailed factor analysis** showing why each bet was placed
- ✅ **Profit/loss calculations** using actual odds
- ✅ **CSV format** for easy analysis and validation

## 🔧 Technical Architecture

### Data Processing Pipeline
1. **Raw Data Ingestion** - Match files and FBRef data
2. **Team Name Normalization** - Consistent naming across sources  
3. **Data Enhancement** - Calculate betting outcomes and metrics
4. **FBRef Integration** - Add detailed match incident analysis
5. **TimeSeries Generation** - Team performance tracking over time

### Analysis Framework
- **Machine Learning Approach** - Adaptive factor combination discovery
- **Statistical Validation** - Pearson correlation and significance testing
- **Backtesting Engine** - Historical performance simulation
- **Strategy Optimization** - Threshold tuning for maximum profitability

### Enhancement Features (v2.0)
- **Match Cleanliness Score** - Penalty/card impact assessment
- **Card Discipline Index** - Team discipline tracking
- **Goal Timing Analysis** - When goals are scored patterns
- **Substitution Patterns** - Tactical change analysis
- **Incident Density** - Match intensity measurement

## 📈 Performance Metrics

### Data Coverage by Season
- **2022-2023**: 380 matches, 106 with FBRef data (28%)
- **2023-2024**: 373 matches, 80 with FBRef data (21%)  
- **2024-2025**: 373 matches, 112 with FBRef data (30%)

### Strategy Performance
- **Success Rate**: 20 profitable strategies from comprehensive analysis
- **ROI Range**: 3% to 61% across different strategy types
- **Win Rates**: 45% to 85% depending on strategy selectivity
- **Total Bets**: 2,000+ individual betting decisions analyzed

## 🛠️ Scripts Reference

### Core Processing Scripts
- `merge-football-data-json.js` - Main data processing and timeSeries generation
- `enhance-asian-handicap.js` - FBRef integration and metric calculation
- `process-football-data.sh` - Automated pipeline orchestration

### FBRef Processing
- `process-all-fbref-incidents.sh` - Batch FBRef data extraction
- `parse-fbref-match-incidents.js` - Individual match incident parsing
- `process-fbref-season.js` - Season-level FBRef processing

### Utilities
- `update-team-mapping.js` - Team name mapping discovery
- `analyze-missing-matches.js` - Data quality analysis
- `data-collection-summary.js` - Processing statistics

## 📚 Documentation

### Strategic Planning
- `plan/master-strategy-plan.md` - Comprehensive betting strategy framework
- `plan/hkjc-realistic-approach.md` - HKJC-specific implementation strategy
- `plan/data-validation-framework.md` - Data quality validation approach

### Analysis Documentation  
- `src/ah-analysis/README.md` - Asian Handicap analysis system overview
- `src/ah-analysis/DISCOVERED_STRATEGIES.md` - Detailed strategy documentation
- `src/ah-analysis/winning_strategies_records_REAL/README.md` - Betting records guide

### Technical Documentation
- `src/scripts/README.md` - Data processing pipeline documentation
- `FBREF_INCIDENT_INTEGRATION_SUMMARY.md` - FBRef integration details

## ⚠️ Important Notes

### Analysis System (CLEAN & OPERATIONAL)
The `src/ah-analysis/` directory contains the essential strategy discovery system with 5 core scripts, 12 rule files, and 42 betting record files. All debugging and intermediate scripts have been archived, leaving only the operational components.

### Data Quality
- All 2022-2023 data issues have been resolved
- TimeSeries data is complete for all seasons
- Enhanced datasets include comprehensive FBRef integration

### Strategy Validation
- All betting records use real historical data
- Profit calculations based on actual market odds
- No look-ahead bias or unrealistic assumptions

## 🔮 Future Development

### Immediate Opportunities
1. **Live Implementation** - Real-time strategy execution
2. **Additional Markets** - Extend beyond Asian Handicap
3. **More Leagues** - Apply framework to other competitions
4. **Enhanced Metrics** - Additional FBRef data integration

### Advanced Features
1. **Machine Learning Models** - Predictive modeling beyond correlation
2. **Market Timing** - Optimal bet placement timing
3. **Portfolio Optimization** - Multi-strategy betting allocation
4. **Risk Management** - Advanced position sizing algorithms

## 📞 Support

For questions about the data processing pipeline or enhancement scripts, refer to the documentation in `src/scripts/README.md`. 

For analysis methodology and strategy details, see the comprehensive documentation in `src/ah-analysis/README.md`.

---

*This system represents a complete data-driven approach to football betting analysis, combining rigorous statistical methods with comprehensive data processing to identify genuine market inefficiencies.* 