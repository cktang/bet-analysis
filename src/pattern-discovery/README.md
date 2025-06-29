# Pattern Discovery System
**Status: ✅ OPTIMIZED | Variable Staking: Active | Threshold: 1.88**

Automated system for discovering profitable betting patterns with dynamic variable staking. Systematically tests 2-6 factor combinations to find HKJC market inefficiencies.

## Quick Start

```bash
# Run optimized discovery (recommended)
node run_discovery.js

# Launch drill dashboard
node launch_dashboards.js
# Opens http://localhost:8888 - Interactive factor drilling interface

# Analyze results 
node run_analysis.js
```

## System Overview

**Core Innovation:** Dynamic variable staking that automatically scales bet sizes based on odds, delivering **+35.3% profit improvement** over fixed staking.

**Current Configuration:**
- **Base stake:** $200 (odds ≤ 1.88)
- **Variable scaling:** +$150 per 0.01 odds above 1.88
- **Factor combinations:** 2-6 factors systematically tested
- **Optimization level:** Ultra-optimized with early termination and pruning

## Key Results

From latest discovery run:
- **20,384 combinations tested** in 18.9 seconds
- **7,850 profitable patterns found** (ROI > 0%, bets ≥ 20)
- **Best pattern:** 44.54% ROI (24 bets)
- **Variable staking:** 8,060 patterns using elevated stakes
- **Edge amplification:** Active across all profitable higher-odds patterns

## Core Components

### Main Files
- `factor_definitions.js` - All betting factors organized by category
- `optimized_discovery.js` - Main discovery engine with variable staking
- `run_discovery.js` - Simple launcher script
- `run_analysis.js` - Complete analysis suite

### Directories
- `results/` - Discovery outputs and summaries
- `dashboards/` - Interactive drilling interface
- `analysis/` - Analysis scripts for results interpretation
- `archive/` - Older versions and utilities

## Variable Staking System

**Breakthrough Discovery:** HKJC inefficiencies concentrate in the 1.88-2.20 odds range. Our system automatically:

1. **Identifies profitable patterns** through systematic factor testing
2. **Calculates optimal stakes** based on odds levels per match
3. **Amplifies edge** by betting more on higher-value opportunities
4. **Maintains risk control** with conservative base stakes

**Formula:**
```javascript
stake = odds ≤ 1.88 ? $200 : $200 + floor((maxOdds - 1.88) * 100) * $150
```

## Factor Categories

**Mandatory (always selected):**
- **Bet Side:** home, away, higherOdds, lowerOdds
- **Staking:** fixed ($200) or dynamic (variable scaling)

**Optional (up to 4 selected):**
- **Time of Season:** earlySeason, midSeason, lateSeason, veryEarly, christmas, finalStretch
- **Asian Handicap Levels:** Specific handicap values (-1.75, -0.25, etc.)
- **Odds Levels:** balanced (≤2.0), extreme (>2.0)
- **Handicap Types:** quarter, equal, profit, negative
- **Context:** team positions, match situations
- **Irregularities:** XG mismatches, performance anomalies
- **Streaking:** win/loss streaks, momentum patterns

## Output Analysis

### Stakes Distribution
- **$200 stakes:** 60.3% of profitable patterns (base case)
- **$200-300:** 27.1% (light variable scaling)
- **$300-500:** 12.6% (heavy variable scaling)
- **Highest observed:** $464.71 average stake

### Profitability by Odds
- **1.81-1.88 range:** 38.4% profitable, $245 avg stake
- **1.89-2.20 range:** 42.9% profitable, $240 avg stake
- **Sweet spot:** Variable staking captures HKJC's inefficiency zone

## Key Insights

1. **HKJC inefficiencies span 1.80-2.20 odds range**
2. **Quarter handicaps remain highly exploitable**
3. **Early season timing multiplies edge significantly**
4. **Away team bias persists across all profitable patterns**
5. **Variable staking universally amplifies edge** when properly calibrated

## Integration Ready

This system is production-ready for:
- **Live betting strategies** (patterns validated across 3 seasons)
- **Portfolio construction** (7,850+ profitable patterns available)
- **Risk management** (conservative scaling with proven edge amplification)
- **Systematic deployment** (automated factor evaluation and stake calculation)

## Interactive Drill Dashboard

**Single-purpose drilling interface** for building and analyzing factor combinations:

```bash
node launch_dashboards.js
# Opens http://localhost:8888 - Interactive factor drilling interface
```

### 🔍 Dashboard Features
- **Step-by-step factor building** with real-time performance updates
- **6-factor maximum** with navigation controls (Reset, Back, Breadcrumb jumping)
- **Individual betting records** showing actual match details and outcomes
- **Real-time data loading** from discovery results with 20,000+ strategies
- **Add-only interface** with navigation-based modification (no individual factor removal)

**Key Capabilities:**
- **Interactive factor selection** from 31 available factors across all categories
- **Immediate ROI calculation** as factors are added
- **Strategy aggregation** showing combined performance across patterns
- **Betting record visualization** with team names, dates, scores, and profit/loss
- **Navigation controls** including step-back and full reset functionality

## Next Steps

1. **Launch drill dashboard** to explore factor combinations interactively
2. **Build 2-6 factor strategies** using the drilling interface
3. **Analyze individual betting records** for selected combinations
4. **Implement top patterns** in live betting system with variable staking
5. **Monitor performance** using the analysis tools

---

*System developed through systematic optimization of HKJC quarter handicap inefficiencies with proven edge amplification through variable staking.* 