# Live Betting System Implementation Plan

## 🎯 Objective
Create a modular live betting system with independent components for 24/7 HKJC odds tracking, strategy execution, and automated betting.

## 📁 Directory Structure
```
src/system/
├── data-feeder/           # 24/7 HKJC + FBRef data collection
│   ├── hkjc-tracker.js    # Continuous odds monitoring
│   ├── match-scheduler.js # Upcoming match detection
│   ├── fbref-enhancer.js  # Match data enhancement
│   └── utils/
│       ├── hkjc-util.js   # Login/navigation (from tests/)
│       └── team-mapping.js
├── strategy-runners/      # Independent strategy execution
│   ├── strategy-engine.js # Core strategy evaluation
│   ├── bankroll-manager.js# Individual strategy bankrolls
│   └── strategies/        # Copied from ah-analysis/rules
├── bet-executor/          # Automated betting system
│   ├── bet-placer.js      # HKJC bet automation
│   ├── bet-validator.js   # Pre-bet validation
│   └── utils/
│       └── hkjc-betting.js # Betting automation (from tests/)
├── monitor/               # Central monitoring & control
│   ├── dashboard.js       # System health monitoring
│   ├── controller.js      # Strategy lifecycle management
│   └── reporter.js        # Performance tracking
├── shared/
│   ├── file-communicator.js # Inter-component communication
│   ├── config.js          # System configuration
│   └── logger.js          # Centralized logging
└── data/                  # File-based communication
    ├── odds/              # Latest HKJC odds
    ├── matches/           # Upcoming matches
    ├── strategies/        # Strategy outputs
    ├── bets/              # Betting queue
    └── control/           # Lifecycle control files
```

## 🔄 Component Architecture

### 1. Data Feeder (24/7 Running)
- **HKJC Tracker**: Continuously scrape latest odds for all EPL matches
- **Match Scheduler**: Detect upcoming matches (5-10 mins before kickoff)
- **FBRef Enhancer**: Add statistical context to matches
- **Output**: `data/odds/latest.json`, `data/matches/upcoming.json`

### 2. Strategy Runners (Independent Processes)
- **Strategy Engine**: Evaluate profitable strategies from validation results
- **Bankroll Manager**: Individual strategy bankroll tracking
- **Dynamic Control**: Enable/disable via `data/control/strategies.json`
- **Output**: `data/strategies/{strategy_name}_signals.json`

### 3. Bet Executor (Pre-match Window)
- **Bet Placer**: Execute bets 5-10 minutes before kickoff
- **Bet Validator**: Verify odds, stakes, and strategy confidence
- **Queue Management**: Process betting signals from all strategies
- **Output**: `data/bets/executed.json`, `data/bets/history.json`

### 4. Central Monitor (Dashboard)
- **Health Checker**: Monitor all component status
- **Performance Tracker**: Real-time P&L across all strategies
- **Control Interface**: Start/stop strategies, adjust parameters
- **Alert System**: Notifications for critical events

## 📋 Implementation Steps

### Phase 1: Foundation (Copy & Structure)
1. **Create directory structure** in `src/system/`
2. **Copy HKJC utilities** from `tests/hkjc-util.ts` → `src/system/shared/`
3. **Copy strategy logic** from `src/ah-analysis/rules/` → `src/system/strategy-runners/strategies/`
4. **Copy testing patterns** from `tests/scrap-hkjc-*.spec.ts` for automation patterns
5. **Copy processing utilities** from `src/ah-analysis/scripts/` for strategy evaluation

### Phase 2: Core Components
1. **File Communication System**: JSON-based message passing with correlation IDs
2. **HKJC Tracker**: Adapt scraping logic for continuous monitoring
3. **Strategy Engine**: Port ah-analysis logic for real-time evaluation
4. **Bet Executor**: Implement 5-10 minute pre-match betting window

### Phase 3: Integration & Control
1. **Central Controller**: Strategy lifecycle management via control files
2. **Monitoring Dashboard**: Real-time system health and performance
3. **Bankroll Management**: Individual strategy allocation and tracking
4. **Error Handling**: Robust failure recovery and alerting

## 🔧 Key Features

### File-Based Communication
- **Read-only design**: Components read from shared data files
- **Correlation IDs**: Track bet signals through entire pipeline
- **Atomic writes**: Prevent data corruption during concurrent access
- **Retry mechanisms**: Handle temporary file locks gracefully

### 24/7 HKJC Monitoring
- **Continuous odds tracking**: Monitor line movements in real-time
- **Match detection**: Auto-discovery of new EPL fixtures
- **Pre-match window**: Execute bets 5-10 minutes before kickoff
- **Session management**: Handle HKJC login/logout cycles

### Dynamic Strategy Control
- **Enable/disable strategies**: Real-time control via JSON config
- **Bankroll allocation**: Individual strategy budgets
- **Performance thresholds**: Auto-disable underperforming strategies
- **Manual overrides**: Emergency stop capabilities

## 📊 Success Metrics
- **Uptime**: 99%+ availability for data feeder
- **Latency**: <30 seconds from odds change to strategy evaluation
- **Accuracy**: 100% bet placement success rate
- **Performance**: Track individual strategy ROI vs validation results

## 📝 Files to Copy

### From `tests/` Directory:
- `hkjc-util.ts` → `src/system/shared/hkjc-util.js` (convert to JS)
- `scrap-hkjc-result.spec.ts` → Extract scraping patterns for hkjc-tracker.js
- `scrap-hkjc-match-schedule.spec.ts` → Extract scheduling patterns for match-scheduler.js

### From `src/ah-analysis/scripts/` Directory:
- `ah_combination_tester.js` → `src/system/strategy-runners/strategy-engine.js` (adapt for real-time)
- `variable_staking_utility.js` → `src/system/strategy-runners/staking-utility.js`
- `rule_loader.js` → `src/system/strategy-runners/rule-loader.js`

### From `src/ah-analysis/rules/` Directory:
- All `.js` files → `src/system/strategy-runners/strategies/` (copy entire directory)

## 🚨 Important Notes

### Strategy Selection
- Focus on **profitable strategies only** from validation results
- Prioritize strategies with ROI > 3% and statistical significance
- Implement dynamic enable/disable based on performance tracking

### HKJC Integration
- Use existing login credentials and security question handling from `hkjc-util.ts`
- Implement session management for 24/7 operation
- Handle rate limiting and anti-bot detection gracefully

### Risk Management
- Individual strategy bankrolls prevent total loss
- Emergency stop mechanisms for all components
- Real-time monitoring of win rates vs expected performance
- Automatic shutdown if significant deviation from validation results

### Technical Requirements
- Node.js + Playwright for browser automation
- File-based communication for robustness
- JSON configuration files for dynamic control
- Comprehensive logging for debugging and auditing

## 🔄 Next Steps (When Resuming)
1. Create the directory structure
2. Copy and adapt the core files
3. Implement file communication system
4. Build HKJC tracker component
5. Port strategy evaluation logic
6. Create bet execution pipeline
7. Build monitoring dashboard
8. Extensive testing with paper trading
9. Gradual live deployment with small stakes

This plan creates a robust, modular system that can scale and adapt while maintaining the proven profitability discovered in the validation phase.