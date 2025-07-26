# Live Betting System V2 - File-Based Communication

## 📁 Directory Structure

```
src/v2/
├── README.md                    # Complete documentation
├── OVERVIEW.md                  # This file
├── nestjs-main.ts              # NestJS entry point
│
├── live-trading/               # Independent trading services
│   ├── odds-monitor.service.ts        # HKJC odds monitoring
│   ├── strategy-decision.service.ts   # Strategy evaluation
│   ├── betting-executor.service.ts    # Bet placement
│   └── results-tracker.service.ts     # P&L tracking
│
├── core/                       # Shared utilities
│   ├── data-file.service.ts    # File I/O operations
│   ├── team-mapping.service.ts # Team name normalization
│   └── betting-history.service.ts # Betting records
│
├── automation/                 # Automation orchestration
│   ├── automation-orchestrator.service.ts # Main coordinator
│   └── trading-scheduler.service.ts # Timing management
│
├── web-interface/             # Web dashboard
│   ├── dashboard.controller.ts # Main dashboard
│   ├── api.controller.ts      # API endpoints
│   └── public/               # Static files
│
└── tests/                     # Component tests
    ├── unit/                 # Unit tests
    └── integration/          # Integration tests
```

## 🔄 File-Based Communication Flow

```
HKJC → OddsMonitor → odds-data.json → StrategyDecision → betting-decisions.json → BettingExecutor
                                                    ↓
bet-results.json ← ResultsTracker ← bet-execution-results.json ← HKJC Results
```

## 📁 Communication Files

- **`odds-data.json`** - Current odds from HKJC
- **`fixture.json`** - Current match fixtures
- **`betting-decisions.json`** - Generated betting signals
- **`bet-execution-results.json`** - Bet placement results
- **`bet-results.json`** - Final match results
- **`automation-trigger.json`** - Automation triggers
- **`strategy.json`** - Loaded strategies

## 🎯 Key Improvements Over V1

1. **File-Based Communication** - Independent services communicate via JSON files
2. **Service Independence** - Each service can run and be tested separately
3. **Enhanced Bet Accuracy** - Fixed home/away confusion issues
4. **Real-time Data Pipeline** - Compatible with existing strategy system
5. **Comprehensive Monitoring** - Health checks and performance tracking

## 🚀 Quick Start

```bash
# Start NestJS system
npm run start

# Or development mode
npm run dev
```

## 📋 Dependencies on V1 System

- **Strategy Files**: `data/v2/strategy.json`
- **Factor Definitions**: `data/v2/factor_definitions.json`
- **Utils**: `src/v2/utils/drilling/AsianHandicapCalculator.js`
- **Data Structure**: Compatible with `data/enhanced/` format

## 🎮 Integration Points

- **Existing Strategies** - Automatically loads from V1 strategy files
- **Enhanced Data** - Generates data compatible with existing analysis system  
- **Performance Tracking** - Saves results to `data/v2/`
- **Odds Storage** - Uses existing `data/odds-movement/` format

This V2 system uses file-based communication for maximum service independence and testability.