# 🤖 Betting Analysis System - Program Flow & Data Storage Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BETTING ANALYSIS SYSTEM                               │
│                              (NestJS + Angular)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1. Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DATA SOURCES  │    │  DATA PROCESSING│    │   ANALYSIS      │    │   LIVE TRADING  │
│                 │    │                 │    │                 │    │                 │
│ • FBRef Scraping│───▶│ • Data Enhancer │───▶│ • Pattern       │───▶│ • Odds Monitor  │
│ • HKJC Browser  │    │ • Data Merger   │    │   Discovery     │    │ • Strategy      │
│ • Mock Data Gen │    │ • Fixture Loader│    │ • Factor        │    │   Decision      │
│                 │    │                 │    │   Analysis      │    │ • Betting       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    │   Executor      │
                                                                     │ • Results       │
                                                                     │   Tracker       │
                                                                     └─────────────────┘
                                                                              │
                                                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DASHBOARD     │◀───│  AUTOMATION     │◀───│  BETTING        │◀───│  STORAGE        │
│                 │    │  ORCHESTRATOR   │    │  HISTORY        │    │                 │
│ • Live Matches  │    │ • Mock Automation│   │ • Session Mgmt  │    │ • JSON Files    │
│ • Performance   │    │ • Trading       │    │ • Cycle Tracking│    │ • CSV Reports   │
│ • Live Feed     │    │   Scheduler     │    │ • Metrics Calc  │    │ • Health Logs   │
│ • Strategies    │    │ • Status Monitor│    │ • Dashboard Data│    │ • Results Cache │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 2. Detailed Data Flow Process

### 2.1 Data Collection Phase
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA COLLECTION                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

1. FBRef Scraping Service
   ├── Scrapes match data from fbref.com
   ├── Stores in: data/raw/fbref/{season}/
   └── Files: {Team}_vs_{Team}_{Score}_{Date}.json

2. HKJC Browser Service  
   ├── Connects to HKJC betting platform
   ├── Extracts odds and betting data
   └── Stores in: data/odds-movement/

3. Mock Data Generator
   ├── Generates realistic match scenarios
   ├── Creates Asian Handicap odds
   └── Simulates betting environment
```

### 2.2 Data Processing Phase
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA PROCESSING                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Data Enhancer Service
   ├── Enriches raw match data
   ├── Adds team statistics
   ├── Calculates form metrics
   └── Stores in: data/enhanced/

2. Data Merger Service
   ├── Combines multiple data sources
   ├── Matches teams across platforms
   └── Creates unified dataset

3. Fixture Service
   ├── Manages upcoming matches
   ├── Tracks trading windows
   └── Schedules automation cycles
```

### 2.3 Analysis Phase
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ANALYSIS ENGINE                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Pattern Discovery Service
   ├── Analyzes historical data
   ├── Identifies profitable patterns
   ├── Evaluates factor combinations
   └── Generates strategy recommendations

2. Factor Analysis
   ├── Team form analysis
   ├── Head-to-head statistics
   ├── Home/away performance
   ├── Seasonal trends
   └── Asian Handicap analysis
```

### 2.4 Live Trading Phase
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LIVE TRADING                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Odds Monitor Service
   ├── Monitors real-time odds
   ├── Tracks odds movements
   └── Detects value opportunities

2. Strategy Decision Service
   ├── Evaluates current matches
   ├── Applies strategy rules
   ├── Calculates expected ROI
   └── Generates betting signals

3. Betting Executor Service
   ├── Executes betting decisions
   ├── Manages stake sizing
   ├── Handles bet placement
   └── Records transaction details

4. Results Tracker Service
   ├── Tracks match outcomes
   ├── Calculates profits/losses
   ├── Updates performance metrics
   └── Saves to persistent storage
```

## 3. Data Storage Architecture

### 3.1 File-Based Storage Structure
```
data/
├── raw/                          # Raw scraped data
│   ├── fbref/                    # FBRef match data
│   │   ├── 2022-2023/
│   │   ├── 2023-2024/
│   │   └── 2024-2025/
│   ├── matches/                  # Match text files
│   └── team-mapping.csv          # Team name mappings
│
├── enhanced/                     # Processed/enriched data
│   ├── year-2022-2023-enhanced.json
│   ├── year-2023-2024-enhanced.json
│   └── week1-2025-2026-enhanced.json
│
├── odds-movement/                # Real-time odds data
│   ├── 1729947376726.json
│   ├── 1729947434685.json
│   └── ... (timestamped files)
│
├── odds-movement-clean/          # Cleaned odds data
│
├── matches-organized/            # Organized match data
│   ├── FB2761_2024-10-26_Brighton_vs_Wolves.json
│   └── _EXPORT_SUMMARY.json
│
├── mock-betting-history/         # Session and cycle data
│   ├── sessions.json             # Active/completed sessions
│   └── match-cycles.json         # Individual match cycles
│
├── health/                       # System health metrics
│   ├── current_metrics.json
│   ├── metrics_2025-07-04.json
│   └── metrics_2025-07-05.json
│
├── results/                      # Analysis results
│
├── processed/                    # Final processed data
│
└── fixtures/                     # Match fixtures
    └── 2024-2025-fixtures.json
```

### 3.2 In-Memory Data Structures
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              IN-MEMORY STORAGE                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

1. BettingHistoryService
   ├── currentSession: BettingSession
   ├── activeCycles: Map<string, MatchCycle>
   └── Performance cache for calculations

2. MockAutomationOrchestratorService
   ├── isRunning: boolean
   ├── lastMatchTime: Date
   ├── matchCounter: number
   └── Session management

3. PatternDiscoveryService
   ├── allMatches: Match[]
   ├── factorDefinitions: Map
   └── Performance cache for factor evaluations

4. ResultsTrackerService
   ├── betRecords: Map<string, BetRecord>
   ├── strategyPerformance: Map<string, StrategyPerformance>
   └── System performance metrics
```

## 4. Automation Flow

### 4.1 Mock Automation Cycle
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTOMATION CYCLE                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

1. SCHEDULER (Every 15 minutes)
   └── Triggers checkForNewMatch()

2. MATCH GENERATION
   ├── MockDataGenerator.createMockMatch()
   ├── Generates realistic match data
   └── Creates Asian Handicap odds

3. PRE-MATCH ANALYSIS
   ├── StrategyDecisionService.evaluateStrategiesForMatch()
   ├── Applies pattern discovery rules
   ├── Calculates expected ROI
   └── Determines betting decision

4. BETTING EXECUTION
   ├── BettingExecutorService.executeBet()
   ├── Records betting decision
   ├── Calculates stake size
   └── Updates session metrics

5. MATCH SIMULATION
   ├── Simulates match duration (2-6 minutes)
   ├── Generates realistic score
   ├── Calculates Asian Handicap result
   └── Determines bet outcome

6. RESULT PROCESSING
   ├── ResultsTrackerService.recordBet()
   ├── Calculates profit/loss
   ├── Updates performance metrics
   └── Saves to persistent storage

7. DASHBOARD UPDATE
   ├── Updates live feed
   ├── Refreshes performance charts
   ├── Updates betting records
   └── Shows real-time metrics
```

## 5. API Endpoints & Data Flow

### 5.1 Dashboard Data Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DASHBOARD     │    │   API LAYER     │    │   SERVICES      │
│                 │    │                 │    │                 │
│ • Live Matches  │◀───│ /api/automation │◀───│ BettingHistory  │
│ • Performance   │    │ /betting-dashboard│   │ Service        │
│ • Live Feed     │    │                 │    │                 │
│ • Strategies    │◀───│ /api/automation │◀───│ MockAutomation  │
│                 │    │ /session-metrics│    │ Orchestrator    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 5.2 Key API Endpoints
```
/api/automation/
├── status                    # System status
├── session-metrics          # Current session data
├── betting-dashboard        # Dashboard data
├── fixtures                 # Today's fixtures
├── trading-window           # Matches in trading window
├── mock-status              # Mock automation status
├── mock/force-match         # Force new match
├── mock/pause               # Pause automation
├── mock/resume              # Resume automation
└── mock/reset               # Reset session

/live-trading/
├── odds/latest              # Latest odds
├── strategies/evaluate-all  # Evaluate all strategies
├── betting/execute          # Execute bet
├── results/system-performance # System performance
└── status                   # Trading status
```

## 6. Data Persistence Strategy

### 6.1 Session Data
```json
// data/mock-betting-history/sessions.json
{
  "sessionId": "SESSION_1751726929956",
  "startTime": "2025-07-05T14:48:49.956Z",
  "totalMatches": 16,
  "totalBets": 4,
  "totalStake": 4100,
  "totalProfit": 998,
  "winRate": 39,
  "roi": 24.34,
  "status": "active"
}
```

### 6.2 Match Cycle Data
```json
// data/mock-betting-history/match-cycles.json
{
  "cycleId": "CYCLE_1751729057524",
  "timestamp": "2025-07-05T15:24:17.524Z",
  "matchData": {
    "matchId": "MOCK_1751729057524_16",
    "homeTeam": "Aston Villa",
    "awayTeam": "Tottenham",
    "kickoffTime": "2025-07-05T15:39:17.524Z",
    "odds": { /* Asian Handicap odds */ }
  },
  "phase": "completed",
  "bettingRecord": {
    "betId": "BET_1751729057524_16",
    "strategy": "GiantKilling-Dynamic-High",
    "betSide": "home",
    "stake": 1500,
    "odds": 1.88,
    "status": "won",
    "profit": 1320
  },
  "matchResult": {
    "homeScore": 2,
    "awayScore": 1,
    "asianHandicapResult": "home"
  }
}
```

### 6.3 Health Metrics
```json
// data/health/current_metrics.json
{
  "timestamp": 1751729043756,
  "cpuUsage": 24,
  "memoryUsage": 99.42,
  "diskUsage": 0.030,
  "serviceHealth": {
    "DataCollection": "warning",
    "DataProcessing": "healthy",
    "Analysis": "warning",
    "LiveTrading": "warning",
    "Database": "healthy"
  }
}
```

## 7. Performance Optimization

### 7.1 Caching Strategy
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PERFORMANCE CACHE                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Factor Evaluations Cache
   ├── Key: "matchKey|expression"
   ├── Value: boolean result
   └── Purpose: Avoid re-evaluating factors

2. Asian Handicap Results Cache
   ├── Key: "homeScore|awayScore|handicap|betSide|odds|stake"
   ├── Value: betting result
   └── Purpose: Avoid recalculating AH results

3. Filtered Matches Cache
   ├── Key: "factorCombinationHash"
   ├── Value: filtered match array
   └── Purpose: Cache filtered match lists

4. Betting Results Cache
   ├── Key: "matchListHash|sideKey|sizeKey"
   ├── Value: complete betting results
   └── Purpose: Cache strategy results
```

### 7.2 Memory Management
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MEMORY MANAGEMENT                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Limited Cycle Storage
   ├── Keep only last 1000 cycles in file
   ├── Active cycles in memory only
   └── Archive old sessions

2. Efficient Data Structures
   ├── Use Maps for O(1) lookups
   ├── Lazy loading of large datasets
   └── Stream processing for large files

3. Garbage Collection
   ├── Clear caches periodically
   ├── Remove completed cycles from memory
   └── Monitor memory usage
```

## 8. Error Handling & Recovery

### 8.1 Error Recovery Strategy
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ERROR HANDLING                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

1. File System Errors
   ├── Retry with exponential backoff
   ├── Fallback to in-memory storage
   └── Log errors for debugging

2. Network Errors
   ├── Retry failed API calls
   ├── Use cached data when available
   └── Graceful degradation

3. Data Corruption
   ├── Validate JSON before parsing
   ├── Backup critical files
   └── Rebuild from scratch if needed

4. Service Failures
   ├── Health monitoring
   ├── Automatic restart
   └── Alert notifications
```

This comprehensive diagram shows how data flows through the entire betting analysis system, from data collection through analysis to live trading and dashboard display, with detailed information about where and how data is stored at each stage. 