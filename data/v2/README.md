# Data/v2 Directory - File-Based Communication System

This directory contains all JSON files used by the v2 betting system for communication between independent services. Each file serves a specific purpose in the automated betting pipeline.

## 🏗️ **System Architecture**

The v2 system uses **file-based communication** where each service reads and writes specific JSON files. This design ensures:
- **Service Independence**: Each service can run separately
- **Easy Debugging**: All communication is visible in JSON files
- **Scalability**: Services can be distributed across machines
- **Testability**: Individual services can be tested in isolation

## 📊 **File-Based Communication Flow**

```
HKJC Website → OddsMonitorService → odds-data.json
                     ↓
StrategyDecisionService → betting-decisions.json
                     ↓
BettingExecutorService → bet-execution-results.json
                     ↓
ResultsTrackerService → bet-results.json
```

## 📁 **File Categories**

### 🎯 **Core Strategy & Configuration Files**

#### `strategy.json`
- **Purpose**: Contains all profitable betting strategies discovered from analysis
- **Written by**: Pattern discovery system / Manual configuration
- **Read by**: StrategyDecisionService
- **Structure**: Array of strategy objects with:
  ```json
  {
    "name": "Christmas-Away",
    "side": { "betSide": "away" },
    "size": { "expression": "1500", "stakingMethod": "fixed" },
    "factors": [
      {
        "key": "christmas",
        "expression": "parseInt(fbref.week) >= 17 && parseInt(fbref.week) <= 22",
        "description": "weeks 17-22"
      }
    ],
    "performance": {
      "roi": 11.92,
      "totalBets": 171,
      "winRate": 55.56,
      "totalProfit": 30585
    }
  }
  ```

#### `factor_definitions.json`
- **Purpose**: Defines all available factors for strategy building
- **Contains**: Factor expressions, descriptions, categories
- **Used by**: Pattern discovery and strategy evaluation

### 📊 **Live Data Pipeline Files**

#### `fixture.json`
- **Purpose**: Current match fixtures with enhanced data
- **Written by**: Fixture loading system
- **Read by**: All services for current match information
- **Structure**: Array of matches with teams, odds, timeSeries, fbref data
- **Example**:
  ```json
  [
    {
      "homeTeam": "Arsenal",
      "awayTeam": "Liverpool",
      "asianHandicapOdds": {
        "homeHandicap": "-0.25",
        "homeOdds": 2.40,
        "awayHandicap": "+0.25",
        "awayOdds": 2.90
      },
      "timeSeries": {
        "home": { "leaguePosition": 4 },
        "away": { "leaguePosition": 2 }
      },
      "fbref": { "week": 8 }
    }
  ]
  ```

#### `odds-data.json`
- **Purpose**: Real-time odds from HKJC
- **Written by**: OddsMonitorService
- **Read by**: StrategyDecisionService
- **Structure**: 
  ```json
  {
    "timestamp": 1234567890,
    "matches": [
      {
        "homeTeam": "Arsenal",
        "awayTeam": "Liverpool", 
        "homeOdds": 2.40,
        "awayOdds": 2.90,
        "handicap": -0.25,
        "source": "hkjc"
      }
    ],
    "source": "hkjc",
    "totalMatches": 1
  }
  ```

### 🔄 **Betting Decision Pipeline**

#### `betting-decisions.json`
- **Purpose**: Generated betting signals ready for execution
- **Written by**: StrategyDecisionService
- **Read by**: BettingExecutorService
- **Cleared after**: Processing by BettingExecutorService
- **Structure**: Array of betting decisions
  ```json
  [
    {
      "strategyName": "Christmas-Away",
      "matchId": "Arsenal_vs_Liverpool_1234567890",
      "homeTeam": "Arsenal",
      "awayTeam": "Liverpool",
      "betSide": "away",
      "handicap": "+0.25",
      "odds": 2.90,
      "stakeAmount": 1500,
      "confidence": 0.75,
      "reasoning": "All factors satisfied",
      "timestamp": 1234567890
    }
  ]
  ```

#### `bet-execution-results.json`
- **Purpose**: Results of bet placement attempts
- **Written by**: BettingExecutorService
- **Read by**: ResultsTrackerService
- **Cleared after**: Processing by ResultsTrackerService
- **Structure**: Array of execution results
  ```json
  [
    {
      "status": "success",
      "betId": "Arsenal_vs_Liverpool_1234567890",
      "hkjcBetId": "PAPER_1234567890",
      "message": "Paper bet recorded successfully",
      "isPaperTrade": true,
      "executionTime": 1234567890,
      "homeTeam": "Arsenal",
      "awayTeam": "Liverpool",
      "betSide": "away",
      "stakeAmount": 1500
    }
  ]
  ```

#### `bet-results.json`
- **Purpose**: Final performance report with P&L calculations
- **Written by**: ResultsTrackerService
- **Read by**: Dashboard and monitoring systems
- **Structure**: Performance summary
  ```json
  {
    "timestamp": 1234567890,
    "totalBets": 25,
    "settledBets": 20,
    "pendingBets": 5,
    "summary": {
      "totalProfit": 12500,
      "totalStaked": 50000,
      "overallWinRate": "60.00",
      "overallROI": "25.00"
    },
    "strategies": [
      {
        "strategyName": "Christmas-Away",
        "totalBets": 10,
        "winRate": "70.00",
        "roi": "15.50",
        "totalProfit": 2325
      }
    ]
  }
  ```

### 🎮 **Trigger & Control Files**

#### `automation-trigger.json`
- **Purpose**: Triggers automated trading cycle
- **Written by**: Automation system or manual testing
- **Read by**: StrategyDecisionService (via file watcher)
- **Structure**: 
  ```json
  [{
    "fixture": { /* fixture data */ },
    "action": "automated_trading_cycle",
    "timestamp": 1234567890
  }]
  ```

#### `manual-trigger.json`
- **Purpose**: Manual testing triggers
- **Used for**: Testing specific scenarios without automation

#### `fixture-refresh-trigger.json`
- **Purpose**: Triggers fixture data refresh
- **Used by**: Automation system to refresh fixture data

#### `force-match-trigger.json`
- **Purpose**: Force match evaluation for testing
- **Used by**: Testing and debugging

### 📝 **Record Keeping Files**

#### `bet-record.json`
- **Purpose**: Individual betting records with match results
- **Written by**: ResultsTrackerService
- **Structure**: Array of bet records with outcomes
  ```json
  [
    {
      "betId": "PAPER_1234567890",
      "matchId": "Arsenal_vs_Liverpool_1234567890",
      "strategyName": "Christmas-Away",
      "homeTeam": "Arsenal",
      "awayTeam": "Liverpool",
      "betSide": "away",
      "odds": 2.90,
      "stakeAmount": 1500,
      "matchResult": {
        "homeScore": 2,
        "awayScore": 1
      },
      "profit": -1500,
      "isWin": false,
      "settledAt": 1234567890
    }
  ]
  ```

#### `bet-decision.json`
- **Purpose**: Single bet decision storage
- **Used by**: DataFileService for individual decisions

#### `bet-pending-decision.json`
- **Purpose**: Pending betting decisions
- **Used by**: Decision tracking system

#### `bet-session.json`
- **Purpose**: Session-based betting tracking
- **Used by**: BettingHistoryService

#### `log.json`
- **Purpose**: System logging and debugging
- **Written by**: All services for troubleshooting
- **Structure**: Array of log entries with timestamps, levels, messages

### 🗂️ **Reference Data**

#### `team-mapping.csv`
- **Purpose**: Maps team names between different data sources
- **Used by**: TeamMappingService
- **Format**: CSV with columns: original_name, normalized_name, aliases

#### `epl-teams-2024-2025.csv`
- **Purpose**: Current EPL team reference data
- **Used by**: Team validation and mapping
- **Format**: CSV with team information

#### `history/` Directory
- **Purpose**: Historical enhanced match data for backtesting
- **Contains**: 
  - `year-2022-2023-enhanced.json`
  - `year-2023-2024-enhanced.json`
  - `year-2024-2025-enhanced.json`
  - `week1-2025-2026-enhanced.json`
- **Used by**: Strategy validation and backtesting

### 📁 **Archive System**

#### `archive/` Directory
- **Purpose**: Automatic archiving of processed betting decisions
- **Created by**: BettingExecutorService
- **Structure**: Timestamped archive files
- **Files**: `bet-decisions-YYYY-MM-DDTHH-MM-SS-sssZ.json`

## 🔄 **Service Communication Pattern**

Each service operates independently and communicates through file watchers:

1. **OddsMonitorService**:
   - Writes: `odds-data.json`
   - Watches: `fixtures.json` for trading window detection

2. **StrategyDecisionService**:
   - Reads: `strategy.json`, `fixture.json`, `odds-data.json`
   - Writes: `betting-decisions.json`
   - Watches: `automation-trigger.json` for evaluation triggers

3. **BettingExecutorService**:
   - Reads: `betting-decisions.json`
   - Writes: `bet-execution-results.json`
   - Archives: Processed decisions to `archive/`
   - Watches: `betting-decisions.json` for new decisions

4. **ResultsTrackerService**:
   - Reads: `bet-execution-results.json`
   - Writes: `bet-results.json`, `bet-record.json`
   - Watches: `bet-execution-results.json` for new results

## 🛠️ **Development & Testing**

### Adding New Strategies
1. Update `strategy.json` with new strategy definition
2. System automatically loads new strategies on next evaluation
3. No code changes required

### Testing Individual Services
Each service can be tested independently by:
1. Creating appropriate input files
2. Running the service
3. Checking output files

### Debugging
- All communication is visible in JSON files
- Check file timestamps to track processing flow
- Use `log.json` for detailed debugging information

## 📊 **File Sizes & Performance**

- **Small files** (< 1KB): Trigger files, single decisions
- **Medium files** (1-100KB): Strategy definitions, current fixtures
- **Large files** (100KB+): Historical data, betting records
- **Auto-cleanup**: Archive system prevents unlimited growth

## 🔒 **File Safety**

- **Atomic writes**: All file operations are atomic
- **Backup system**: Archive system preserves processed data
- **Error handling**: Services handle missing/corrupted files gracefully
- **Validation**: All JSON files are validated before processing

## 📈 **Monitoring**

Monitor system health by checking:
- File modification timestamps
- `log.json` for errors
- `bet-results.json` for performance metrics
- Archive directory for processing history

---

This file-based communication system ensures reliable, debuggable, and scalable operation of the v2 betting system while maintaining complete service independence.