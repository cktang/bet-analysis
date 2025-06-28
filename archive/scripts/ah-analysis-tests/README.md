# 📁 AH-ANALYSIS TESTING SCRIPTS ARCHIVE

## 🎯 Overview

This archive contains testing scripts that were accumulated in the `src/ah-analysis/` directory over time. These scripts were used for testing various betting strategies, debugging issues, and analyzing different approaches to Asian Handicap betting. They have been organized by category and preserved for historical reference.

---

## 📂 **ARCHIVE ORGANIZATION**

### **Directory Structure**
```
scripts/archive/ah-analysis-tests/
├── README.md (this file)
├── variable-staking/           # Variable staking tests and analysis
├── odds-analysis/              # Odds movement and analysis scripts
├── hkjc-analysis/              # HKJC trapped markets and threshold theory tests
├── debug-scripts/              # Debugging, utility, and development scripts
└── old-results/                # Result files from various tests
```

---

## 📊 **VARIABLE STAKING TESTS** (`variable-staking/`)

These scripts test different variable staking configurations and implementations:

### **Core Variable Staking Tests**
- `full_season_flat_betting.js` - Full season analysis with flat betting baseline
- `away_team_early_season_strategy.js` - Away team betting with variable staking
- `seasonal_week_amplifier_test.js` - Week-based amplifier testing
- `test_full_handicap_variable_staking.js` - Full handicap coverage with variable staking

### **Result Files**
- `full_season_flat_betting_results.json` - Baseline flat betting results
- `full_season_away_analysis.json` - Away team analysis results
- `all_away_team_early_season_variable_stake_results.json` - Variable staking on away teams
- `seasonal_week_amplifier_results.json` - Week amplifier test results

### **Historical Significance**
These scripts were used to validate our **variable staking breakthrough** [[memory:796971609614219539]] which provides **27% more profit** than fixed staking systems.

---

## 📈 **ODDS ANALYSIS** (`odds-analysis/`)

Scripts for analyzing odds movements, patterns, and market efficiency:

### **Market Analysis Scripts**
- `clean_odds_analyzer.js` - Clean odds pattern analysis
- `odds_movement_analyzer.js` - Odds movement tracking and analysis
- `optimized_higher_odds_strategy.js` - Higher odds betting optimization

### **Result Files**
- `clean_odds_analysis_report.json` - Clean odds analysis results
- `odds_movement_analysis_report.json` - Odds movement analysis
- `optimized_higher_odds_results.json` - Higher odds optimization results

### **Purpose**
These scripts helped identify market inefficiencies and odds patterns that contributed to our market intelligence discoveries.

---

## 🎯 **HKJC ANALYSIS** (`hkjc-analysis/`)

Scripts testing HKJC trapped markets theory and threshold patterns:

### **HKJC Trapped Markets Tests**
- `hkjc_manipulation_analysis.js` - HKJC market manipulation analysis
- `enhanced_hkjc_manipulation_analysis.js` - Enhanced HKJC analysis
- `hkjc_1x2_arbitrage_analysis.js` - HKJC arbitrage opportunities
- `hkjc_trapped_mechanism.js` - Core trapped mechanism testing

### **Threshold Theory Tests**
- `quarter_handicap_gradient_test.js` - Quarter handicap gradient betting
- `gradient_betting_test.js` - General gradient betting analysis
- `league_wide_gradient_analysis.js` - League-wide gradient patterns
- `specific_0_minus05_comparison.js` - Specific handicap line analysis

### **Quarter Handicap Specific Tests**
- `quarter_handicap_breakdown_test.js` - Quarter handicap breakdown analysis
- `simple_odds_comparison.js` - Odds comparison on quarter lines
- `detailed_case_analysis.js` - Detailed case studies

### **Documentation**
- `HKJC_TRAPPED_STRATEGY_DOCUMENTATION.md` - HKJC strategy documentation
- `THRESHOLD_THEORY_BREAKTHROUGH.md` - Threshold theory breakthrough analysis

### **Result Files**
- `hkjc_manipulation_results.json` - HKJC manipulation test results
- `hkjc_1x2_arbitrage_results.json` - Arbitrage analysis results

### **Historical Significance**
These scripts validated our **HKJC trapped markets discovery** [[memory:8629622791241927242]] showing **28% ROI, 59% win rate** and our **threshold theory** [[memory:3314732832357616299]] revealing **U-shaped market inefficiency patterns**.

---

## 🔧 **DEBUG SCRIPTS** (`debug-scripts/`)

Debugging, utility, and development scripts:

### **Debugging Scripts**
- `debug_impossible_loss.js` - Debug impossible loss calculations
- `debug_weekly_calculations.js` - Debug weekly calculation logic
- `debug_quarter_handicap_logic.js` - Debug quarter handicap calculations
- `correct_mirror_strategy.js` - Mirror strategy correction
- `fixed_handicap_calculation.js` - Fixed handicap calculation logic

### **Analysis & Testing Scripts**
- `test_clean_edge_detection.js` - Clean edge detection testing
- `test_live_edge_detector.js` - Live edge detection testing
- `test_home_underdog_quarters.js` - Home underdog quarter testing
- `test_refined_thresholds.js` - Refined threshold testing
- `test_public_vs_sharp.js` - Public vs sharp money analysis
- `test_manipulation_theory.js` - Market manipulation theory testing

### **Utility Scripts**
- `compare_strategies.js` - Strategy comparison utility
- `live_edge_detector.js` - Live edge detection system
- `match_by_match_exporter.js` - Match-by-match data export
- `handicap_by_season_week.js` - Seasonal handicap analysis
- `handicap_level_breakdown.js` - Handicap level breakdown
- `detailed_betting_table.js` - Detailed betting table generation
- `export_home_advantage_betting_records.js` - Home advantage export utility
- `update_summary_with_home_advantage.js` - Summary update utility

### **Strategy Development Scripts**
- `exact_replication.js` - Strategy replication testing
- `fixed_away_team_strategy.js` - Fixed away team strategy
- `corrected_higher_odds_test.js` - Corrected higher odds testing
- `higher_odds_corrected_test.js` - Higher odds correction testing
- `higher_odds_analysis.js` - Higher odds analysis

### **Historical Significance**
These scripts were crucial for debugging our **critical bug fixes** [[memory:4217952587686306013], [memory:7727057030799092682]] including the Asian Handicap calculation errors and betting side transfer bugs.

---

## 📊 **OLD RESULTS** (`old-results/`)

Result files from various historical tests and analyses:

### **Types of Results**
- Variable staking test results
- Strategy comparison results
- Edge detection test results
- Quarter handicap analysis results
- Historical betting record exports
- Seasonal analysis outputs

### **File Patterns**
- `*_results.json` - Test result files
- `*_analysis.json` - Analysis output files  
- `*_variable_stake_results.json` - Variable staking results
- `*_betting_records.json` - Historical betting records

### **Purpose**
These files preserve the historical test results that contributed to our major discoveries but are no longer needed for active development.

---

## 🚀 **USAGE GUIDELINES**

### **Running Archived Scripts**
```bash
# Navigate to specific archive category
cd scripts/archive/ah-analysis-tests/variable-staking/

# Run variable staking tests (update data paths as needed)
node full_season_flat_betting.js

# Run HKJC analysis tests
cd ../hkjc-analysis/
node quarter_handicap_gradient_test.js

# Run debug utilities
cd ../debug-scripts/
node compare_strategies.js
```

### **Important Notes**
- **Data Path Updates**: Many scripts reference old data paths - update as needed
- **Node.js Required**: All scripts require Node.js environment
- **Large Datasets**: Some scripts process extensive match data
- **Memory Requirements**: Scripts may be memory intensive
- **Dependencies**: Ensure required packages are installed

---

## 📊 **HISTORICAL SIGNIFICANCE**

### **Breakthrough Validation**
These scripts were instrumental in validating our major discoveries:

1. **Variable Staking System**: Scripts in `variable-staking/` validated the 27% profit improvement
2. **HKJC Trapped Markets**: Scripts in `hkjc-analysis/` confirmed the 28% ROI trapped market theory
3. **Threshold Theory**: Quarter handicap tests validated U-shaped market inefficiency patterns
4. **Bug Fixes**: Debug scripts helped identify and fix critical calculation errors

### **System Evolution**
The scripts show the evolution of our betting analysis system:
- Early flat betting approaches
- Development of variable staking
- Discovery of market inefficiencies
- Refinement of calculation logic
- Implementation of breakthrough strategies

---

## ⚠️ **MAINTENANCE STATUS**

### **Archive Status**
- **Status**: ✅ **ARCHIVED** - Scripts preserved for historical reference
- **Active Development**: No longer part of active workflow
- **Reference Only**: Use for understanding system evolution and validation history
- **Bug Fixes**: Critical fixes have been integrated into main system

### **Quality Notes**
- **Data Integrity**: Some scripts may use outdated data structures
- **Dependencies**: Package versions may be outdated
- **Performance**: Scripts may not be optimized for current system
- **Validation**: Results may differ from current system implementations

---

## 🎯 **CURRENT SYSTEM STATUS**

### **Clean ah-analysis Directory**
After cleanup, `src/ah-analysis/` now contains only:
- ✅ **Core system files** (`scripts/`, `results/`, `rules/`, `report/`)
- ✅ **Essential scripts** (`run_complete_analysis.sh`, `quick_run.sh`)
- ✅ **Core documentation** (`README.md`, `FLOW_GUIDE.md`)

### **Active vs Archived**
- **Active**: Core analysis engine and current results
- **Archived**: Historical tests, experiments, and debugging scripts
- **Purpose**: Clean separation between production system and development history

---

## 📚 **RELATIONSHIP TO MAIN DISCOVERIES**

### **Variable Staking Revolution** [[memory:796971609614219539]]
- **Validation Scripts**: `variable-staking/` directory
- **Key Results**: 27% profit improvement, 176% bankroll growth
- **Implementation**: Tier-based scaling system

### **HKJC Trapped Markets** [[memory:8629622791241927242]]
- **Validation Scripts**: `hkjc-analysis/` directory  
- **Key Results**: 28% ROI, 59% win rate on quarter handicaps
- **Implementation**: Fade public favorites ≤1.72 odds

### **Threshold Theory** [[memory:3314732832357616299]]
- **Validation Scripts**: Quarter handicap tests in `hkjc-analysis/`
- **Key Results**: U-shaped inefficiency pattern, 39.69% ROI early season
- **Implementation**: Seasonal betting patterns based on favorite strength

### **Critical Bug Fixes** [[memory:4217952587686306013], [memory:7727057030799092682]]
- **Debug Scripts**: `debug-scripts/` directory
- **Key Fixes**: Asian Handicap calculations, betting side transfers
- **Implementation**: System stability and accuracy improvements

---

## 🎯 **SUMMARY**

This archive preserves **100+ testing scripts** that were crucial in developing and validating our breakthrough betting analysis system. While no longer part of active development, these scripts represent the validation foundation for our systematic edge discoveries.

**The scripts document the journey from basic betting analysis to a sophisticated system with proven market inefficiencies and revolutionary staking methods.**

---

*Archive Created*: December 2024  
*Scripts Archived*: 100+ files across 5 categories  
*Historical Period*: Development and validation of breakthrough discoveries  
*Status*: Preserved and Documented ✅ 