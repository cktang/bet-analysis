# 🤖 Betting Analysis System - Program Flow & Data Storage Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BETTING ANALYSIS SYSTEM                               │
│                    (NestJS + Factor Drilling + File-Based)                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1. Current System Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DATA SOURCES  │    │  DATA PROCESSING│    │   ANALYSIS      │    │   LIVE TRADING  │
│                 │    │                 │    │                 │    │                 │
│ • FBRef Scraping│───▶│ • Data Enhancer │───▶│ • Pattern       │───▶│ • Odds Monitor  │
│ • HKJC Browser  │    │ • Data Merger   │    │   Discovery     │    │ • Strategy      │
│ • Historical    │    │ • File-Based    │    │ • Factor        │    │   Decision      │
│   Match Data    │    │   Storage       │    │   Drilling      │    │ • Betting       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    │   Executor      │
                                                                     │ • Results       │
                                                                     │   Tracker       │
                                                                     └─────────────────┘
                                                                              │
                                                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FACTOR        │◀───│  SHARED         │◀───│  FILE-BASED     │◀───│  STORAGE        │
│   DRILLING      │    │  SERVICES       │    │  COMMUNICATION  │    │                 │
│                 │    │                 │    │                 │    │                 │
│ • Interactive   │    │ • Shared Browser│    │ • JSON Files    │    │ • data/v2/      │
│   Interface     │    │ • Betting Utils │    │ • File Watchers │    │ • Browser       │
│ • Real-time     │    │ • Data File     │    │ • Event Streams │    │   Profiles      │
│   Drilling      │    │   Service       │    │ • RxJS Streams  │    │ • Configuration │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 2. Detailed Data Flow Process

### 2.1 Data Collection & Processing Phase
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DATA COLLECTION & PROCESSING                          │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Historical Data Processing
   ├── Raw match files: data/raw/matches/{season}/
   ├── FBRef data: data/raw/fbref/{season}/
   ├── merge-football-data-json.js → data/processed/
   └── enhance-asian-handicap.js → data/enhanced/

2. Live Data Collection (V2 System)
   ├── SharedBrowserService manages browser instances
   ├── OddsMonitorService scrapes HKJC odds
   ├── DataFileService writes odds-data.json
   └── File watchers trigger downstream processing

3. Pattern Discovery System
   ├── Interactive factor drilling interface
   ├── Real-time factor combination analysis
   ├── Individual betting record display
   └── Statistical performance evaluation
```

### 2.2 File-Based Communication System
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FILE-BASED COMMUNICATION                              │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Data Flow Chain
   ├── odds-data.json (OddsMonitorService)
   ├── betting-decisions.json (BettingDecisionService)
   ├── bet-record.json (BettingExecutorService)
   └── system-config.json (All services)

2. File Watchers
   ├── chokidar.watch() monitors JSON files
   ├── RxJS streams process file changes
   ├── throttleTime() prevents excessive triggers
   └── concatMap() ensures sequential processing

3. Shared Services
   ├── SharedBrowserService (isolated browser instances)
   ├── BettingUtilitiesService (common betting logic)
   ├── DataFileService (file operations & config)
   └── Season collision prevention system
```

### 2.3 Factor Drilling Analysis
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            FACTOR DRILLING SYSTEM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Interactive Interface
   ├── Add-only factor selection
   ├── Navigation controls (Reset, Back, Breadcrumb)
   ├── Real-time drilling through combinations
   └── Individual betting record display

2. Factor Analysis
   ├── Dynamic factor combination testing
   ├── Statistical performance evaluation
   ├── Real match data with actual odds
   └── Profit/loss calculations with AsianHandicapCalculator

3. Data Sources
   ├── Enhanced historical data (1,126 matches)
   ├── Real team names and match results
   ├── Pre-match data only (no look-ahead bias)
   └── Season-aware match identification
```

### 2.4 Live Trading System
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            LIVE TRADING SYSTEM                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Odds Monitor Service
   ├── SharedBrowserService.getPageInstance('OddsMonitor')
   ├── Scrapes HKJC odds every 30 seconds
   ├── Writes odds-data.json
   └── Triggers BettingDecisionService

2. Strategy Decision Service
   ├── Watches odds-data.json for changes
   ├── Loads strategies from DataFileService
   ├── Evaluates match criteria
   └── Writes betting-decisions.json

3. Betting Executor Service
   ├── Watches betting-decisions.json
   ├── Filters by time window (0-10 mins before kickoff)
   ├── Prevents duplicates with season-aware keys
   ├── BettingUtilitiesService.placeBet() or executePaperBet()
   └── Records results in bet-record.json

4. Results Tracker Service
   ├── Monitors bet outcomes
   ├── Calculates profit/loss
   ├── Updates performance metrics
   └── Provides system status
```

## 3. Current Data Storage Architecture

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
├── processed/                    # Processed match data
│   ├── year-2022-2023.json
│   ├── year-2023-2024.json
│   └── year-2024-2025.json
│
├── enhanced/                     # Enhanced with FBRef data
│   ├── year-2022-2023-enhanced.json
│   ├── year-2023-2024-enhanced.json
│   └── year-2024-2025-enhanced.json
│
└── v2/                          # Live trading system data
    ├── odds-data.json           # Current HKJC odds
    ├── betting-decisions.json   # Strategy evaluation results
    ├── bet-record.json          # Executed bet history
    ├── system-config.json       # System configuration
    ├── strategies.json          # Active betting strategies
    └── browser-*/              # Browser profile directories
        ├── browser-betting-executor/
        ├── browser-odds-monitor/
        └── browser-analysis/
```

### 3.2 In-Memory Data Management
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            IN-MEMORY DATA MANAGEMENT                            │
└─────────────────────────────────────────────────────────────────────────────────┘

1. SharedBrowserService
   ├── browserInstances: Map<string, Browser>
   ├── pageInstances: Map<string, Page>
   ├── loginStates: Map<string, boolean>
   └── serviceConfigs: Map<string, BrowserConfig>

2. BettingExecutorService
   ├── placedBets: Set<string> (season-aware match keys)
   ├── bettingDecisionSubject: RxJS Subject
   ├── fileWatcher: chokidar.FSWatcher
   └── Duplicate prevention tracking

3. DataFileService
   ├── Configuration cache
   ├── Strategy definitions
   ├── File operation queues
   └── Error handling and retry logic

4. Factor Drilling System
   ├── Interactive factor combinations
   ├── Real-time drilling results
   ├── Individual betting records
   └── Navigation state management
```

## 4. Shared Services Architecture

### 4.1 Core Services Integration
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SHARED SERVICES PATTERN                             │
└─────────────────────────────────────────────────────────────────────────────────┘

1. SharedBrowserService
   ├── Centralized browser management
   ├── Isolated instances per service
   ├── Unified login/logout handling
   └── Debugging port assignment (9224, 9225, 9226)

2. BettingUtilitiesService
   ├── Common betting logic
   ├── Bet validation and formatting
   ├── Season collision prevention
   └── Paper trading simulation

3. DataFileService
   ├── File-based communication hub
   ├── Configuration management
   ├── JSON file operations
   └── Strategy and factor loading

4. Dependency Injection
   ├── NestJS @Injectable() decorators
   ├── Constructor injection
   ├── Service lifecycle management
   └── Staggered initialization (1s, 3s delays)
```

### 4.2 Season Collision Prevention
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SEASON COLLISION PREVENTION                            │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Problem: "Southampton v Arsenal" appears in multiple seasons
   ├── 2022-23 season: Early season data
   ├── 2023-24 season: Mid season data
   ├── 2024-25 season: Current season data
   └── Risk: Wrong match evaluation = wrong betting decisions

2. Solution: Season-aware match keys
   ├── extractSeasonFromDecision() function
   ├── generateMatchKey() with season prefix
   ├── Format: "2024-25_Southampton v Arsenal"
   └── Prevents catastrophic betting errors

3. Implementation
   ├── BettingUtilitiesService.generateMatchKey()
   ├── Used in duplicate prevention
   ├── Used in betting record tracking
   └── Mandatory for all match identification
```

## 5. Factor Drilling Interface Flow

### 5.1 Interactive Drilling Process
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FACTOR DRILLING INTERFACE                            │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Interface Access
   ├── Standalone: node scripts/launch_dashboards.js → localhost:8888
   ├── NestJS: cd src/v2 && npm run start:dev → localhost:3000
   └── Root redirect: localhost:3000 → /analysis/drill-app

2. Drilling Process
   ├── Add factor from available list
   ├── Real-time combination evaluation
   ├── Individual betting records display
   └── Navigation controls (Reset, Back, Breadcrumb)

3. Data Display
   ├── Performance metrics (ROI, win rate)
   ├── Match count and statistics
   ├── Individual bet details
   └── Real team names and match results

4. Navigation Features
   ├── Add-only interface (no individual removal)
   ├── Reset button for full clear
   ├── Back button for step-by-step undo
   └── Breadcrumb jumping for quick navigation
```

### 5.2 Analysis Controller Integration
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ANALYSIS CONTROLLER                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Static File Serving
   ├── ServeStaticModule.forRoot() configuration
   ├── Serves pattern-discovery files
   ├── Root path: src/pattern-discovery/
   └── Serve root: /drill

2. API Endpoints
   ├── GET /analysis/drill-app → serves drilling interface
   ├── GET /analysis/drill-data → serves JSON data
   ├── Static assets served automatically
   └── Root redirect from AppController

3. Data Integration
   ├── Serves enhanced historical data
   ├── Real-time factor evaluation
   ├── Individual betting record access
   └── Performance calculation endpoints
```

## 6. Current System Status

### 6.1 Operational Components
```
✅ FULLY OPERATIONAL:
├── Factor drilling interface (localhost:8888, localhost:3000)
├── Shared services architecture (browser, betting, data)
├── File-based communication system
├── Season collision prevention
├── Historical data processing pipeline
└── Interactive pattern discovery

🟡 LIVE TRADING READY:
├── Odds monitoring service
├── Strategy evaluation engine
├── Betting executor with duplicate prevention
├── Results tracking and performance metrics
└── Browser automation with isolated instances

🚀 READY FOR DEPLOYMENT:
├── HKJC credentials integration
├── Real-time automated trading
├── Live betting execution
└── Performance monitoring
```

### 6.2 Key Improvements Implemented
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RECENT IMPROVEMENTS                               │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Eliminated Code Duplication
   ├── Shared browser management
   ├── Common betting utilities
   ├── Centralized configuration
   └── Unified error handling

2. Enhanced Reliability
   ├── Isolated browser instances
   ├── File-based data persistence
   ├── Season-aware match keys
   └── Staggered service initialization

3. Simplified Architecture
   ├── Removed coordinator system complexity
   ├── Direct file watching
   ├── Shared services pattern
   └── Single responsibility principle

4. User Experience
   ├── Simplified dashboard interface
   ├── Add-only factor selection
   ├── Enhanced navigation controls
   └── Individual betting record display
```

This comprehensive diagram shows the current system architecture focusing on the file-based communication system, shared services pattern, and factor drilling interface that represents the actual implementation after refactoring.

---

*This document reflects the current system state after major refactoring to eliminate duplication and implement shared services architecture.*