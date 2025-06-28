# Asian Handicap Analysis System

This folder contains a sophisticated feedback loop system for discovering profitable Asian Handicap betting patterns using EPL data from 3 seasons.

## Overview

The system uses machine learning-inspired techniques to:
1. **Generate hypotheses** about which factors correlate with Asian Handicap profitability
2. **Test these hypotheses** against historical data 
3. **Learn from results** to generate better hypotheses in the next iteration
4. **Continuously improve** through adaptive feedback loops

## Architecture

### 🧠 Core Scripts

#### 1. `ah_combination_generator.js`
**Purpose**: Intelligently generates factor combinations to test against AH profit data

**Features**:
- **Base Factors**: XG data, performance metrics, odds, market efficiency, contextual data
- **Derived Factors**: XG differences, odds ratios, efficiency metrics, market bias
- **Adaptive Learning**: Analyzes previous results to generate improved combinations
- **Domain Knowledge**: Incorporates football betting expertise into combinations

**Key Methods**:
- `generateInitialCombinations()` - Creates first-pass combinations
- `generateAdaptiveCombinations()` - Learns from previous iterations
- `analyzeFactorImportance()` - Identifies most predictive factors

#### 2. `ah_combination_tester.js`
**Purpose**: Tests combinations against 3 seasons of EPL data and measures correlation with AH profits

**Features**:
- **Statistical Analysis**: Pearson correlation calculation
- **Backtesting Engine**: Simulates betting strategies with different thresholds
- **Profitability Analysis**: Measures ROI for home/away betting strategies
- **Data Validation**: Ensures robust testing with sufficient sample sizes

**Key Methods**:
- `testCombination()` - Evaluates single factor combination
- `backtestStrategy()` - Simulates betting with optimal thresholds
- `calculateCorrelation()` - Measures factor-profit relationships

#### 3. `run_feedback_loop.js`
**Purpose**: Orchestrates the entire adaptive learning process

**Features**:
- **Iterative Learning**: Runs multiple generator→tester cycles
- **Convergence Detection**: Stops when improvements plateau
- **Progress Tracking**: Monitors improvement across iterations
- **Final Reporting**: Generates comprehensive analysis and recommendations

## Data Flow

```
EPL Match Data (3 seasons)
        ↓
Factor Combination Generator
        ↓
Combination Testing Engine
        ↓
Results Analysis & Learning
        ↓
Adaptive Combination Generation
        ↓
[Repeat until convergence]
        ↓
Final Report & Recommendations
```

## Usage

### Quick Start
```bash
cd src/ah-analysis/
node run_feedback_loop.js
```

### Individual Components
```bash
# Generate combinations only
node ah_combination_generator.js

# Test existing combinations
node ah_combination_tester.js

# Run full feedback loop with custom iterations
node -e "
const AHFeedbackLoop = require('./run_feedback_loop');
new AHFeedbackLoop(5).runLoop();
"
```

## Data Sources

The system analyzes the following factors from your EPL data:

### 📊 Expected Goals (XG)
- `fbref.homeXG`, `fbref.awayXG`
- XG differences and efficiency metrics
- Total expected goals vs actual outcomes

### 🎯 Performance Metrics
- Goal efficiency (actual vs expected)
- XG accuracy and differences
- Team over/under-performance patterns

### 💰 Market Data
- Asian Handicap odds and lines
- 1X2 odds (home/draw/away)
- Over/Under 2.5 goals odds
- Market efficiency and cut percentages

### 🏟️ Contextual Factors
- Week in season (fatigue/form effects)
- Attendance figures
- Referee assignments

## Output Files

### `ah_combinations.json`
Generated combinations with metadata:
```json
{
  "metadata": {
    "totalCombinations": 89,
    "adaptiveCombinations": 12,
    "categories": { "single": 45, "domain": 15, ... }
  },
  "combinations": [
    {
      "name": "XG_vs_Odds",
      "factors": ["fbref.homeXG - fbref.awayXG", "match.homeWinOdds / match.awayWinOdds"],
      "hypothesis": "XG difference vs market odds difference indicates value",
      "type": "domain"
    }
  ]
}
```

### `ah_analysis_results.json`
Historical results and performance tracking:
```json
{
  "iterations": [
    {
      "timestamp": "2025-01-15T10:30:00Z",
      "summary": {
        "bestCorrelation": 0.2847,
        "profitableStrategies": 12,
        "significantCorrelations": 23
      }
    }
  ],
  "bestCombinations": [ /* Top 100 across all iterations */ ]
}
```

### `ah_final_report.json`
Comprehensive analysis and recommendations:
```json
{
  "bestOverallCombinations": [ /* Top 10 factors */ ],
  "recommendations": [
    "Focus on XG_vs_Market_Efficiency - shows 0.2847 correlation",
    "15 combinations show >2% profitability - consider ensemble approach"
  ],
  "keyInsights": [
    "Expected Goals appears in 8/10 top combinations",
    "Market efficiency factors show consistent predictive power"
  ]
}
```

## Algorithm Details

### Adaptive Learning Process

1. **Initial Generation**: Creates combinations based on:
   - Single factors (45 combinations)
   - Domain knowledge pairs (football betting theory)
   - Complex multi-factor combinations

2. **Testing & Evaluation**: Each combination is tested by:
   - Calculating correlation with home/away AH profits
   - Backtesting with optimal thresholds (quartile-based)
   - Measuring profitability and win rates

3. **Adaptive Feedback**: Successful combinations spawn:
   - Extended versions (adding complementary factors)
   - Ratio combinations (factor1/factor2)
   - Refined thresholds and conditions

4. **Convergence**: Loop stops when:
   - Very strong correlation found (>0.5)
   - Minimal improvement for 3+ iterations
   - Maximum iterations reached

### Statistical Robustness

- **Sample Size**: Requires minimum 10 valid matches per combination
- **Correlation Method**: Pearson correlation coefficient
- **Backtesting**: Multiple threshold testing (25th, 50th, 75th percentiles)
- **Validation**: Cross-checks against multiple seasons

## Key Insights from Architecture

1. **Factor Importance Tracking**: Identifies which individual factors appear most in successful combinations
2. **Seasonal Robustness**: Tests across 3 different EPL seasons to avoid overfitting
3. **Market Efficiency Analysis**: Measures how well markets price Asian Handicap lines
4. **XG Integration**: Leverages Expected Goals as a core predictive metric
5. **Ensemble Potential**: Identifies multiple profitable strategies for combination

## Extending the System

### Adding New Factors
Edit `ah_combination_generator.js`:
```javascript
this.baseFactors.newCategory = [
  'your.new.factor.path',
  'another.factor.expression'
];
```

### Custom Combination Logic
Extend `generateAdaptiveCombinations()` method with your own pattern recognition.

### Different Sports/Markets
Modify the data loading and profit calculation logic in `ah_combination_tester.js`.

## Performance Notes

- **Memory Usage**: ~100MB for 3 seasons of EPL data
- **Execution Time**: ~30-60 seconds per iteration
- **Parallelization**: Single-threaded but can be extended for parallel testing
- **Data Efficiency**: Filters invalid samples early to optimize processing

This system provides a scientific approach to discovering profitable Asian Handicap patterns while continuously learning and improving from its own results.