# Asian Handicap Factor Drilling Tool - Complete Documentation

## Overview

The Factor Drilling Tool is a sophisticated web application for discovering profitable Asian Handicap betting strategies through systematic factor analysis. It allows users to drill down through various match factors to identify winning patterns and strategies.

## Application URL
```
http://localhost:3001/analysis/drill-app
```

## Core Architecture

### Data Flow
```
Enhanced Match Data → Factor Selection → Strategy Evaluation → Performance Analysis → Strategy Saving
```

### Key Components
1. **Factor Categories** (Left Sidebar)
2. **Strategy Performance** (Center Panel)
3. **Saved Strategies** (Top Right)
4. **Betting Records Table** (Bottom)

## Factor System

### Required Parameters (Always Selected)

#### Betting Direction (SIDE)
- **Home**: Always bet on home team
- **Away**: Always bet on away team
- **Higher Odds**: Bet on team with higher odds (underdog)
- **Lower Odds**: Bet on team with lower odds (favorite)

#### Stake Size (SIZE)
- **Fixed ($200)**: Consistent $200 per bet
- **Dynamic**: Variable staking based on odds
  - Formula: `base + (odds_difference * multiplier)`
  - Increases stakes for higher odds to maximize edge

### Optional Factors (Multi-Category Selection)

#### Time-Based Factors
- **Ultra Early**: Weeks 1-4
- **Very Early**: Weeks 5-8  
- **First Half**: Weeks 1-19
- **Mid Season**: Weeks 9-24
- **Late Season**: Weeks 25+
- **Second Half**: Weeks 20+
- **Christmas**: Weeks 17-22
- **Final Stretch**: Weeks 32-38
- **Business End**: Week 26+

#### Asian Handicap Levels
- **Minus 3**: Handicap -2.75, -3, -3.25
- **Minus 2.75**: Quarter handicap -2.75
- **Minus 2**: Handicap -1.75, -2, -2.25
- **Minus 1.75**: Quarter handicap -1.75
- **Zero**: Level handicap 0
- **Plus 0.25**: Quarter handicap +0.25

#### Team Favorites/Performance
- **Home Favorite**: Home team favored
- **Away Favorite**: Away team favored
- **Equal Handicap**: Level betting odds
- **Quarter Handicap**: 0.25/0.75 increments
- **Extreme Home Favorites**: Heavy home favorites
- **Extreme Away Favorites**: Heavy away favorites

## Strategy Performance Metrics

### Key Performance Indicators (KPIs)
1. **Total Bets**: Number of qualifying matches
2. **Total Stake**: Sum of all bet amounts
3. **Total Profit**: Net profit/loss amount
4. **ROI (Return on Investment)**: Profit as percentage of stake
5. **Win Rate**: Percentage of winning bets
6. **Record**: Wins/Losses/Pushes breakdown

### Performance Visualization
- **Cumulative Profit Chart**: Time-series chart showing profit progression
- **Interactive Tooltips**: Hover for detailed bet information
- **Color Coding**: Green for profit, red for loss

## Betting Records Analysis

### Detailed Bet Information
Each betting record shows:
- **Date**: Match date
- **Match**: Home vs Away teams (clickable for team analysis)
- **Score**: Final match score
- **Handicap**: Asian Handicap value
- **Side**: Betting direction (HOME/AWAY)
- **Odds**: Betting odds received
- **Stake**: Amount wagered
- **Result**: Bet outcome (WIN/LOSS/HALF-WIN/etc.)
- **P&L**: Profit/Loss for individual bet
- **Factor Values**: Dynamic columns for selected factors

### Team Analysis Modal
Clicking team names opens detailed analysis:
- **Overall Record**: Win/Loss/Draw statistics
- **Home/Away Performance**: Venue-specific records
- **Asian Handicap Record**: AH-specific performance
- **Current Streaks**: Active winning/losing streaks
- **Match History**: Complete season performance

## Strategy Management System

### Saved Strategies (Top Right Panel)
- **Strategy List**: Shows saved strategies with performance
- **Quick Load**: Click strategy name to load configuration
- **Performance Preview**: Shows bets, ROI for each strategy
- **Delete Option**: Remove unwanted strategies

### Strategy Controls
- **Strategy Name**: Input field for naming strategies
- **Save**: Store current factor combination
- **Clear All**: Reset all selections
- **Export**: Download strategy as JSON file
- **Import**: Load strategy from JSON file

### localStorage Integration
- Strategies automatically saved to browser localStorage
- Persistent across browser sessions
- Backup through export/import functionality

## Current Winning Strategies (As Shown)

### 1. Away-Dynamic Strategy
- **Configuration**: SIDE: Away, SIZE: Dynamic + factors
- **Performance**: 164 bets, 1329 bets, 8.3% ROI
- **Factors**: Unknown (need to load to see)

### 2. "=0.25-Early-Away" Strategy  
- **Configuration**: SIDE: Away + early season + 0.25 handicap
- **Performance**: 164 bets, 39 bets, 30.7% ROI
- **Key Factors**: Quarter handicap, Early season, Away betting

### 3. "Geling-thw-Extreme-High" Strategy
- **Performance**: Multiple saved variants available
- **Focus**: Extreme situations analysis

## Data Sources

### Enhanced Match Data
- **2022-2023 Season**: Complete season data
- **2023-2024 Season**: Complete season data  
- **2024-2025 Season**: Current/partial season data
- **Total Matches**: 1044+ historical matches

### Factor Definitions
- **Dynamic Loading**: JSON-based factor definitions
- **Expression-Based**: JavaScript expressions for factor evaluation
- **Real-Time Calculation**: ROI calculated for each factor combination

## Performance Optimization Features

### Caching System
- **Factor Evaluation Cache**: Reuses calculated factor results
- **Asian Handicap Cache**: Caches betting calculations
- **Match Filtering Cache**: Stores filtered match sets
- **Results Cache**: Complete betting result caching

### Cache Statistics
- Hit rates displayed for performance monitoring
- Memory-efficient caching with intelligent cleanup
- Real-time performance metrics in status bar

## Technical Implementation

### Frontend Technologies
- **Pure JavaScript**: No framework dependencies
- **Chart.js**: Interactive profit visualization
- **CSS Grid/Flexbox**: Responsive layout system
- **LocalStorage API**: Client-side strategy persistence

### Backend Integration
- **NestJS API**: RESTful endpoints for data access
- **File-Based Data**: JSON data loading and processing
- **Real-Time Updates**: Dynamic factor ROI calculations

### API Endpoints
- `/analysis/drill-app`: Main application interface
- `/analysis/drill-data/factor_definitions.json`: Factor configuration
- `/analysis/data/enhanced/*.json`: Historical match data
- `/analysis/js/AsianHandicapCalculator.js`: Betting calculations

## Usage Workflow

### 1. Strategy Discovery Process
1. **Select Betting Direction**: Choose SIDE (Home/Away/Higher Odds/Lower Odds)
2. **Select Stake Method**: Choose SIZE (Fixed/Dynamic)
3. **Add Optional Factors**: Select from categorized factors on left
4. **Analyze Performance**: Review metrics in center panel
5. **Examine Records**: Check individual betting records
6. **Save Strategy**: Name and save profitable combinations

### 2. Strategy Optimization Process
1. **Load Existing Strategy**: Click saved strategy from top right
2. **Modify Factors**: Add/remove factors to improve performance
3. **Compare Results**: Observe ROI and win rate changes
4. **Fine-tune**: Iterate until optimal performance found
5. **Update Strategy**: Save improved version

### 3. Strategy Validation Process
1. **Check Sample Size**: Ensure sufficient betting opportunities
2. **Analyze Profit Curve**: Look for consistent upward trend
3. **Review Win Rate**: Balance with ROI for sustainability
4. **Examine Streaks**: Check for catastrophic loss periods
5. **Test Robustness**: Verify performance across seasons

## Key Success Factors

### High-Performance Strategies Show
- **ROI > 10%**: Strong return on investment
- **Win Rate > 50%**: More wins than losses
- **Sample Size > 30**: Statistical significance
- **Consistent Curve**: Steady profit accumulation
- **Balanced Risk**: Controlled drawdown periods

### Warning Signs
- **Negative ROI**: Loss-making strategies
- **Low Sample Size**: Insufficient data for validation
- **Volatile Curve**: Extreme profit swings
- **Long Losing Streaks**: High risk of bankruptcy
- **Seasonal Bias**: Performance limited to specific periods

## Future Enhancement Opportunities

### Automation Features Needed
1. **Systematic Factor Combination Testing**
2. **Automated Strategy Scoring and Ranking**
3. **Monte Carlo Simulation for Risk Assessment**
4. **Multi-Objective Optimization (ROI vs Risk)**
5. **Backtesting with Walk-Forward Analysis**
6. **Strategy Performance Decay Detection**

### Advanced Analytics
1. **Factor Correlation Analysis**
2. **Market Efficiency Detection**
3. **Bankroll Management Optimization**
4. **Real-Time Strategy Alerts**
5. **Machine Learning Pattern Recognition**

## Current Status: Manual Strategy Discovery

The tool currently requires manual factor selection and analysis. Users must:
- Manually test factor combinations
- Manually evaluate performance metrics  
- Manually save promising strategies
- Manually compare strategy performance

**Next Step**: Implement automated strategy discovery system to systematically explore all factor combinations and identify optimal strategies.