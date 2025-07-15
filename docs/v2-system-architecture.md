# V2 Live Trading System - Architecture Documentation

## Overview

This document provides a comprehensive guide to the V2 Live Trading System architecture, focusing on the current shared services implementation and file-based communication system.

## 🎯 Current System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     🤖 LIVE TRADING SYSTEM V2 (NESTJS)                         │
└─────────────────────────────────────────────────────────────────────────────────┘

    📂 File-Based Communication            🔧 Shared Services              🎯 Factor Drilling
           │                                     │                              │
           │ JSON Data Exchange                  │ Browser & Betting Utils      │ Interactive Analysis
           ▼                                     ▼                              ▼
   ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
   │  📁 Data Files  │              │  ⚙️  Core       │              │  🧠 Analysis    │
   │  Service        │◄─────────────┤  Services       │─────────────►│  Controller     │
   │                 │              │                 │              │                 │
   │ • Config Load   │              │ • Shared Browser│              │ • Factor Drill  │
   │ • File Watch    │              │ • Betting Utils │              │ • Interactive UI│
   │ • Data Persist  │              │ • Validation    │              │ • JSON Serving  │
   └─────────────────┘              └─────────────────┘              └─────────────────┘
           │                                     │                              │
           │                                     │                              │
           ▼                                     ▼                              ▼
                                    
           📊 ODDS MONITOR ◄──────────────────────────────────────► 🎯 BETTING EXECUTOR
                    │                                                          │
                    │ Live Odds Data                      Betting Decisions    │
                    │ + Market Updates                    + Execution Results  │
                    ▼                                                          ▼
                    
            💡 BETTING DECISION SERVICE                            📈 RESULTS TRACKER
                    │                                                          ▲
                    │ Strategy Evaluation:                                     │
                    │ "Match criteria met?"                                    │
                    ▼                                                          │
                    
            📁 FILE WATCHER SYSTEM ──────────────────────────────────────────────┘
                    │
                    │ Complete Trading Cycle:
                    │ 1. Watch Files → 2. Process → 3. Execute → 4. Record
                    ▼
                    
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                          🌐 FACTOR DRILLING INTERFACE                       │
    │                                                                             │
    │  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐ │
    │  │🔍 FACTOR    │    │📊 DRILL RESULTS  │    │🎯 BETTING RECORDS          │ │
    │  │  SELECTION  │    │                  │    │                             │ │
    │  │             │    │ 📈 Performance   │    │ 💰 Individual bets         │ │
    │  │• Add Factor │    │ 🎯 Strategy ROI  │    │ 📊 Match details           │ │
    │  │• Navigation │    │ 📋 Match Count   │    │ ⚙️  Profit/Loss calc      │ │
    │  │• Breadcrumbs│    │ 🔢 Statistics    │    │                             │ │
    │  │             │    │                  │    │ Real match data             │ │
    │  └─────────────┘    └──────────────────┘    └─────────────────────────────┘ │
    │                                                                             │
    │  🟢 SYSTEM ACTIVE    🟢 FILE WATCHING    🟡 INTERACTIVE MODE                │
    └─────────────────────────────────────────────────────────────────────────────┘
                                         ▲
                                         │
                              📡 ANALYSIS CONTROLLER
                                   (Static serving)
```

## 🏗️ Core Services Architecture

### 1. **SharedBrowserService** (`src/v2/core/shared-browser.service.ts`)
- **Centralized browser management** with isolated instances per service
- **Isolated profiles** to prevent conflicts (betting-executor, odds-monitor, etc.)
- **Unified login/logout** handling with session management
- **Debugging ports** assigned per service (9224, 9225, 9226)

### 2. **BettingUtilitiesService** (`src/v2/core/betting-utilities.service.ts`)
- **Common betting logic** shared across all services
- **Bet validation** and request formatting
- **Season collision prevention** with standardized match keys
- **Paper trading** simulation capabilities

### 3. **DataFileService** (`src/v2/core/data-file.service.ts`)
- **File-based communication** hub for all data exchange
- **Configuration management** for system settings
- **JSON file operations** with error handling
- **Strategy and factor** data loading

## 📊 File-Based Communication System

### Data Files Structure (`data/v2/`)
```
data/v2/
├── odds-data.json          # Live odds from HKJC
├── betting-decisions.json  # Strategy evaluation results
├── bet-record.json         # Executed bet history
├── system-config.json      # System configuration
├── strategies.json         # Betting strategies
└── browser-*/             # Browser profile directories
```

### Communication Flow
1. **OddsMonitorService** → writes `odds-data.json`
2. **BettingDecisionService** → watches `odds-data.json` → writes `betting-decisions.json`
3. **BettingExecutorService** → watches `betting-decisions.json` → writes `bet-record.json`
4. **All services** → read configuration from `system-config.json`

## 🎯 Factor Drilling Integration

### Analysis Controller (`src/v2/analysis/analysis.controller.ts`)
- **Factor drilling interface** serving at `/analysis/drill-app`
- **JSON data serving** for interactive drilling
- **Static file serving** for the drilling UI
- **Root redirect** from `/` to factor drilling app

### Interactive Features
- **Add-only interface** for factor selection
- **Navigation controls** (Reset, Back, Breadcrumb jumping)
- **Individual betting records** with complete match details
- **Real-time drilling** through factor combinations

## ⚡ Service Initialization Flow

```
🟢 NestJS Bootstrap (nestjs-main.ts)
     │
     ├─ App Module Loads
     │   ├─ Core Module (SharedBrowserService, BettingUtilitiesService, DataFileService)
     │   ├─ LiveTradingModule (BettingExecutorService, OddsMonitorService, BettingDecisionService)
     │   ├─ AnalysisModule (AnalysisController for factor drilling)
     │   ├─ DataCollectionModule (Market data collection)
     │   ├─ AutomationModule (Scheduling and coordination)
     │   └─ HealthModule (System health monitoring)
     │
🟡 Service Initialization (onModuleInit)
     │
     ├─ SharedBrowserService.initialize() → Setup browser management
     ├─ BettingExecutorService.initialize() → Setup file watching (3s delay)
     ├─ OddsMonitorService.initialize() → Setup odds monitoring (1s delay)
     ├─ BettingDecisionService.initialize() → Setup decision engine
     └─ DataFileService.initialize() → Load configuration files
     │
🟢 Server Starts on Port 3000
     │
     ├─ Factor Drilling Available: http://localhost:3000/analysis/drill-app
     ├─ Root Redirect: http://localhost:3000 → /analysis/drill-app
     └─ System Status: http://localhost:3000/health
```

## 🔄 Live Trading Flow

### 1. **Odds Monitoring**
```
OddsMonitorService (every 30s)
     │
     ├─ SharedBrowserService.getPageInstance('OddsMonitor')
     ├─ Scrape current HKJC odds
     ├─ DataFileService.writeFile('odds-data.json')
     └─ BettingDecisionService receives file change event
```

### 2. **Strategy Evaluation**
```
BettingDecisionService (file watcher)
     │
     ├─ DataFileService.readFile('odds-data.json')
     ├─ DataFileService.getStrategies()
     ├─ Evaluate each match against strategies
     ├─ Generate betting decisions
     └─ DataFileService.writeFile('betting-decisions.json')
```

### 3. **Bet Execution**
```
BettingExecutorService (file watcher + RxJS)
     │
     ├─ DataFileService.readFile('betting-decisions.json')
     ├─ Filter by time window (0-10 mins before kickoff)
     ├─ Prevent duplicates with season-aware match keys
     ├─ BettingUtilitiesService.placeBet() OR executePaperBet()
     └─ DataFileService.addBetRecord()
```

## 🛠️ Key Architectural Improvements

### Eliminated Duplication
- **Shared browser management** replaces multiple browser instances
- **Common betting utilities** eliminate code duplication
- **Centralized configuration** through DataFileService
- **Unified error handling** across all services

### Enhanced Reliability
- **Isolated browser instances** prevent conflicts
- **File-based communication** ensures data persistence
- **Duplicate prevention** with season-aware match keys
- **Staggered initialization** prevents startup conflicts

### Simplified Architecture
- **Removed coordinator system** complexity
- **Direct file watching** instead of complex event bus
- **Shared services** pattern for common functionality
- **Single responsibility** principle for each service

## 📱 Current Usage

### Starting the System
```bash
# Start live trading system
cd src/v2
npm run start:dev

# Access factor drilling interface
# http://localhost:3000 (redirects to /analysis/drill-app)
```

### Alternative Factor Drilling
```bash
# Start standalone factor drilling
node scripts/launch_dashboards.js

# Access at http://localhost:8888
```

## 🔧 Configuration Files

### System Configuration (`config/live-betting.json`)
- **HKJC credentials** for automated trading
- **System settings** (paper trading, live betting modes)
- **Browser configuration** (headless mode, timeouts)

### Strategy Configuration (`src/v2/strategies.json`)
- **Proven betting strategies** from pattern discovery
- **Factor definitions** and evaluation logic
- **Staking rules** and risk management

## 📈 Current Status

**✅ COMPLETED:**
- Shared services architecture implementation
- File-based communication system
- Factor drilling interface integration
- Duplicate prevention with season-aware keys
- Staggered service initialization
- Clean module structure

**🟡 OPERATIONAL:**
- Live trading system with shared browser management
- Interactive factor drilling at localhost:3000
- File-based data exchange between services
- Automated bet execution with duplicate prevention

**🚀 READY FOR:**
- Live deployment with HKJC credentials
- Real-time automated trading execution
- Pattern discovery through factor drilling interface
- Integration with proven betting strategies

---

*This document reflects the current V2 system architecture after major refactoring to eliminate duplication and implement shared services pattern.*