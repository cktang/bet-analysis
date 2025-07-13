# V2 Automated Betting System - Architecture Documentation

## Overview

This document provides a comprehensive visual guide to the V2 Automated Betting System architecture, data flows, and component interactions.

## 🎯 V2 System Visual Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           🤖 AUTOMATED BETTING SYSTEM V2                        │
└─────────────────────────────────────────────────────────────────────────────────┘

     🌐 HKJC Website                    📋 Config Files                🎯 Strategy Files
           │                                  │                              │
           │ Fixtures, Odds, Betting          │ Credentials, Settings        │ Proven Strategies
           ▼                                  ▼                              ▼
   ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
   │  🔗 Browser     │              │  ⚙️  Core       │              │  🧠 Analysis    │
   │  Service        │◄─────────────┤  Services       │─────────────►│  Engine         │
   │                 │              │                 │              │                 │
   │ • Login/Logout  │              │ • Config Load   │              │ • Load Strategy │
   │ • Scrape Data   │              │ • Team Mapping  │              │ • Factor Eval   │
   │ • Place Bets    │              │ • Validation    │              │ • Pattern Match │
   └─────────────────┘              └─────────────────┘              └─────────────────┘
           │                                  │                              │
           │                                  │                              │
           ▼                                  ▼                              ▼
                                    
           📅 FIXTURE SERVICE ◄──────────────────────────────────────► 🎯 STRATEGY SERVICE
                    │                                                          │
                    │ Today's EPL Matches                    Strategy Signals  │
                    │ + Kickoff Times                        + Betting Advice  │
                    ▼                                                          ▼
                    
            ⏰ TRADING SCHEDULER                                    💰 BETTING EXECUTOR
                    │                                                          ▲
                    │ Every Minute Check:                                      │
                    │ "5-10 mins before kickoff?"                            │
                    ▼                                                          │
                    
            🎭 AUTOMATION ORCHESTRATOR ──────────────────────────────────────────┘
                    │
                    │ Complete Trading Cycle:
                    │ 1. Get Odds → 2. Evaluate → 3. Bet → 4. Record
                    ▼
                    
            📈 RESULTS TRACKER
                    │
                    │ P&L, Win Rate, ROI
                    │ Bet History
                    ▼
                    
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                          🌐 PROFESSIONAL TRADING INTERFACE                   │
    │                                                                             │
    │  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐ │
    │  │📅 TODAY'S   │    │📊 PERFORMANCE    │    │📱 LIVE ACTIVITY FEED       │ │
    │  │  FIXTURES   │    │   CHARTS         │    │                             │ │
    │  │             │    │                  │    │ ⚡ Trading signals          │ │
    │  │• Arsenal vs │    │ $$$ Daily P&L    │    │ 💰 Bet placements          │ │
    │  │  Chelsea    │    │ 📈 ROI Graph     │    │ 📊 Odds updates            │ │
    │  │• Man City vs│    │ 🎯 Win Rate      │    │ ⚙️  System events          │ │
    │  │  Liverpool  │    │ 📋 Total Bets    │    │                             │ │
    │  │             │    │                  │    │ Auto-refresh: 30s           │ │
    │  └─────────────┘    └──────────────────┘    └─────────────────────────────┘ │
    │                                                                             │
    │  🟢 AUTOMATION ACTIVE    🟢 HKJC CONNECTED    🟡 PAPER TRADING             │
    └─────────────────────────────────────────────────────────────────────────────┘
                                         ▲
                                         │
                              📡 REST API ENDPOINTS
                                   (Auto-refresh)
```

## ⚡ Real-Time Flow Animation

```
TIME: 8:00 AM - Daily Fixture Load
┌─────────────────────────────────────────────┐
│ 📅 FIXTURE SERVICE                          │
│ "Loading today's EPL fixtures..."           │  ──► 🌐 HKJC Website
│                                             │  ◄── Arsenal vs Chelsea (3:00 PM)
│ ✅ Loaded 3 matches for today               │  ◄── Man City vs Liverpool (5:30 PM)
└─────────────────────────────────────────────┘  ◄── Tottenham vs Man Utd (8:00 PM)

TIME: 2:50 PM - Trading Window Detected
┌─────────────────────────────────────────────┐
│ ⏰ TRADING SCHEDULER                        │
│ "Arsenal vs Chelsea in 10 minutes!"        │  ──► 🎭 ORCHESTRATOR
│                                             │      "Start automated cycle!"
└─────────────────────────────────────────────┘

TIME: 2:51 PM - Automated Trading Cycle
┌─────────────────────────────────────────────┐      ┌─────────────────────────────┐
│ 🎭 ORCHESTRATOR                             │ ──►  │ 🔗 BROWSER SERVICE         │
│ "Step 1: Get latest odds..."                │      │ "Scraping Arsenal vs        │
└─────────────────────────────────────────────┘      │  Chelsea odds..."           │
                     ▼                                             │
┌─────────────────────────────────────────────┐                   ▼
│ 🧠 STRATEGY SERVICE                         │              🌐 HKJC Website
│ "Evaluating 20 strategies..."              │              Home: 1.85, Away: 2.05
│ ✅ Strategy 'homeUnderdog' triggered!       │              Handicap: Arsenal -0.5
└─────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐      ┌─────────────────────────────┐
│ 💰 BETTING EXECUTOR                         │ ──►  │ 🔗 BROWSER SERVICE         │
│ "Placing $200 bet on Chelsea +0.5..."      │      │ "Logging into HKJC..."     │
└─────────────────────────────────────────────┘      │ "Navigating to match..."    │
                     ▼                                │ "Selecting Chelsea..."      │
┌─────────────────────────────────────────────┐      │ "Entering $200..."         │
│ 📈 RESULTS TRACKER                          │      │ "Confirming bet..."        │
│ "✅ Bet recorded: Bet ID #12345"            │      │ "✅ Bet placed!"           │
│ "💰 Daily P&L: +$47.50"                    │      └─────────────────────────────┘
└─────────────────────────────────────────────┘

TIME: 2:52 PM - Dashboard Updates
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🌐 PROFESSIONAL TRADING INTERFACE                                           │
│                                                                             │
│ 📱 LIVE ACTIVITY FEED:                                                      │
│ ⚡ 14:52 - Trading window detected: Arsenal vs Chelsea                      │
│ 💰 14:52 - Bet placed: Chelsea +0.5 @ 2.05 ($200)                         │
│ 📊 14:52 - homeUnderdog strategy triggered                                 │
│ ⚙️  14:52 - Automation cycle completed successfully                        │
│                                                                             │
│ 📊 PERFORMANCE: Daily P&L: +$47.50 | ROI: 12.3% | Win Rate: 67%           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Simplified Component Interaction

```
USER                    SYSTEM                      EXTERNAL
 │                        │                           │
 │ Open Dashboard         │                           │
 │ ──────────────────────►│                           │
 │                        │ Load Config Files         │
 │                        │ ◄─────────────────────────│
 │                        │                           │
 │                        │ Daily: Load Fixtures      │
 │                        │ ──────────────────────────►│ HKJC
 │                        │ ◄──────────────────────────│
 │                        │                           │
 │ See Live Interface     │ Every Minute: Check Time  │
 │ ◄──────────────────────│                           │
 │                        │                           │
 │                        │ 5-10 mins before? YES!    │
 │                        │ ──────────────────────────►│ HKJC
 │                        │ ◄──────────────────────────│ (Auto Trade)
 │                        │                           │
 │ Watch Live Updates     │ Update Dashboard          │
 │ ◄──────────────────────│                           │
 │                        │                           │
```

## 🏗️ NestJS Application Startup Flow

```
🟢 NestJS Bootstrap (nestjs-main.ts)
     │
     ├─ App Module Loads
     │   ├─ Core Module (HkjcBrowserService, TeamMappingService)
     │   ├─ Data Collection Module (HkjcScrapingService, FbrefScrapingService)
     │   ├─ Data Processing Module (DataMergerService, DataEnhancerService)
     │   ├─ Analysis Module (PatternDiscoveryService, FactorDrillingService)
     │   ├─ Live Trading Module (OddsMonitorService, StrategyDecisionService, BettingExecutorService, ResultsTrackerService)
     │   ├─ Automation Module (FixtureService, TradingSchedulerService, AutomationOrchestratorService)
     │   ├─ Web Interface Module (DashboardController, ApiController)
     │   └─ Health Module (SystemHealthService)
     │
🟡 Service Initialization (onModuleInit for each service)
     │
     ├─ PatternDiscoveryService.loadFactorDefinitions() → src/v2/factor_definitions.json
     ├─ PatternDiscoveryService.loadStrategies() → src/v2/strategy.json
     ├─ StrategyDecisionService.loadStrategies() → src/v2/strategy.json
     ├─ FixtureService.initialize() → HkjcBrowserService (DISABLED for startup)
     ├─ OddsMonitorService.initialize() → (DISABLED for startup)
     └─ Other services initialize...
     │
🟢 Server Starts on Port 3000
     │
     ├─ Web Interface Available: http://localhost:3000
     ├─ Dashboard: http://localhost:3000/dashboard → automated-dashboard.html
     └─ API Endpoints: http://localhost:3000/api/*
```

## ⚙️ Automation Flow (When Enabled)

```
⏰ TradingSchedulerService (@Cron Jobs)
     │
     ├─ Daily Fixture Load (8 AM): FixtureService.loadDailyFixtures()
     │   └─ HkjcBrowserService.scrapeTodaysFixtures() → EPL fixtures with kickoff times
     │
     └─ Every Minute Check: TradingSchedulerService.checkTradingWindows()
           │
           ├─ FixtureService.getMatchesInTradingWindow() → 5-10 mins before kickoff?
           │
           └─ IF matches found → AutomationOrchestratorService.executeAutomatedTradingCycle()
                 │
                 ├─ Step 1: HkjcBrowserService.scrapeMatchOdds(matchId)
                 │     └─ Get current Asian Handicap odds for match
                 │
                 ├─ Step 2: StrategyDecisionService.evaluateStrategiesForMatch(matchData)
                 │     ├─ Load strategies from strategy.json
                 │     ├─ Evaluate each strategy's factors against match
                 │     └─ Generate betting signals (if strategy criteria met)
                 │
                 ├─ Step 3: For each betting signal → HkjcBrowserService.placeBet()
                 │     ├─ Login to HKJC (if not logged in)
                 │     ├─ Navigate to match betting page
                 │     ├─ Select home/away based on signal
                 │     ├─ Enter stake amount
                 │     └─ Confirm bet placement
                 │
                 └─ Step 4: ResultsTrackerService.recordBet(betResult)
                       └─ Save bet record with timestamp, strategy, odds, stake
```

## 🌐 Web Interface Flow

```
🌐 User visits http://localhost:3000
     │
     ├─ DashboardController.root() → redirects to /dashboard
     │
     └─ DashboardController.dashboard() → serves automated-dashboard.html
           │
           └─ Professional Trading Interface Loads:
                 │
                 ├─ Left Panel: Today's Fixtures
                 │   └─ API: GET /api/automation/fixtures
                 │       └─ FixtureService.getTodaysFixtures()
                 │
                 ├─ Center Panel: Performance Charts
                 │   └─ API: GET /api/performance/system
                 │       └─ ResultsTrackerService.getSystemPerformance()
                 │
                 ├─ Right Panel: Live Activity Feed
                 │   └─ Real-time updates from automation events
                 │
                 ├─ Top Bar: System Status Indicators
                 │   ├─ Automation Active/Inactive
                 │   ├─ HKJC Connected/Disconnected
                 │   └─ Paper Trading/Live Trading
                 │
                 └─ Auto-refresh every 30 seconds
                       └─ Calls all API endpoints to update data
```

## 📊 API Endpoint Flow

```
ApiController (/api) provides:

🤖 Automation Monitoring:
     ├─ GET /api/automation/status → TradingSchedulerService + AutomationOrchestratorService status
     ├─ GET /api/automation/fixtures → FixtureService.getTodaysFixtures()
     └─ GET /api/automation/trading-window → FixtureService.getMatchesInTradingWindow()

📊 Performance Tracking:
     ├─ GET /api/performance/system → ResultsTrackerService.getSystemPerformance()
     ├─ GET /api/performance/strategies → ResultsTrackerService.getAllStrategyPerformances()
     └─ POST /api/performance/update → ResultsTrackerService.manualUpdateResults()

🏥 System Health:
     ├─ GET /api/system/status → Overall system status with all service states
     └─ Shows: Automation, HKJC, Trading mode, Service health

🔍 Analysis (Available but not used in automation):
     ├─ POST /api/analysis/discover-patterns → PatternDiscoveryService.discoverPatterns()
     ├─ POST /api/analysis/drill-factors → FactorDrillingService.drillFactors()
     └─ GET /api/analysis/strategies → PatternDiscoveryService.getStrategies()

⚙️ Configuration:
     ├─ GET /api/config/system → Current system configuration
     └─ POST /api/config/validate-credentials → BettingExecutorService.validateCredentials()
```

## 🔄 Data Flow Architecture

```
Configuration Files:
├─ .env → Environment variables (credentials, settings)
├─ config/live-betting.json → HKJC credentials and system config
├─ src/v2/strategy.json → Proven betting strategies
└─ src/v2/factor_definitions.json → Factor definitions for analysis

Runtime Data Flow:
     ┌─ HKJC Website (Live Data)
     │     ├─ Fixture Data → FixtureService
     │     ├─ Odds Data → OddsMonitorService  
     │     └─ Bet Placement → BettingExecutorService
     │
     ├─ Strategy Files → StrategyDecisionService
     │     └─ Factor Evaluation → Betting Signals
     │
     └─ Results Storage:
           ├─ Bet Records → ResultsTrackerService
           ├─ Performance Metrics → Dashboard
           └─ Activity Logs → Live Feed
```

## 💾 Key Files and Directories

### Core Application Files
- `src/v2/nestjs-main.ts` - Main NestJS application entry point
- `src/v2/app.module.ts` - Root application module
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables
- `config/live-betting.json` - HKJC credentials and settings

### Strategy and Configuration Files
- `src/v2/strategy.json` - Proven betting strategies (copied from pattern-discovery)
- `src/v2/factor_definitions.json` - Factor definitions for analysis (copied from pattern-discovery)

### Core Services
- `src/v2/core/hkjc-browser.service.ts` - Browser automation for HKJC interaction
- `src/v2/core/team-mapping.service.ts` - EPL team name mappings

### Automation Services
- `src/v2/fixtures/fixture.service.ts` - Daily fixture loading and trading window detection
- `src/v2/automation/trading-scheduler.service.ts` - Cron jobs for automation timing
- `src/v2/automation/automation-orchestrator.service.ts` - Complete trading cycle execution

### Live Trading Services
- `src/v2/live-trading/strategy-decision.service.ts` - Strategy evaluation and signal generation
- `src/v2/live-trading/betting-executor.service.ts` - HKJC bet placement
- `src/v2/live-trading/results-tracker.service.ts` - P&L tracking and performance metrics
- `src/v2/live-trading/odds-monitor.service.ts` - Real-time odds monitoring

### Web Interface
- `src/v2/web-interface/public/automated-dashboard.html` - Professional trading interface
- `src/v2/web-interface/dashboard.controller.ts` - Dashboard serving
- `src/v2/web-interface/api.controller.ts` - REST API endpoints

## 🚀 Your "Super Simple Flow" Implementation

The user's approved "super simple flow" is implemented as:

```
Daily: Load Fixtures → Every Minute: Check Time → 5-10 mins before? → YES → Auto Trade
                                      │                                      │
                                      ▼                                      ▼
                                 Keep Checking ←────────────────────── Monitor Results
```

**Actual Implementation:**
1. **Daily Load Fixtures (8 AM)**: `FixtureService.loadDailyFixtures()` via cron job
2. **Every Minute Check**: `TradingSchedulerService.checkTradingWindows()` via cron job
3. **5-10 mins before kickoff**: `FixtureService.getMatchesInTradingWindow()`
4. **Auto Trade**: `AutomationOrchestratorService.executeAutomatedTradingCycle()`
5. **Monitor Results**: Real-time dashboard updates and `ResultsTrackerService`

## 🎯 Professional Trading Interface Features

The V2 system includes a professional stock trading-style interface with:

- **Dark Theme**: Terminal-like aesthetics matching factor drilling tool
- **Real-time Charts**: Performance graphs with Chart.js
- **Live Activity Feed**: Real-time automation events
- **System Status**: Green/red indicators for all services
- **Performance Metrics**: Daily P&L, ROI, win rates
- **Auto-refresh**: 30-second intervals for live data

## 📈 Current Status

**✅ COMPLETED:**
- NestJS architecture setup
- All service implementations
- Professional trading interface
- TypeScript compilation fixes
- Configuration file setup
- API endpoint implementation

**🟡 CURRENT ISSUE:**
- System hangs during service initialization (likely browser automation startup)
- Temporary fix: Browser initialization disabled for quick startup

**🚀 READY FOR:**
- Final browser automation debugging
- Live deployment with HKJC credentials
- Real-time automated trading execution

---

*This document serves as the definitive reference for the V2 Automated Betting System architecture and implementation.*