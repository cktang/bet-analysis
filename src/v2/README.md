# Live Trading System V2 - Shared Services Architecture

A file-based communication system that integrates live betting automation with factor drilling analysis. The system uses shared services to eliminate code duplication and provides both automated trading capabilities and interactive pattern discovery.

## 🎯 Overview

This system implements the breakthrough discoveries from your PROJECT_STATUS.md:
- **Variable Staking System** (27% profit improvement)
- **HKJC Quarter Handicap Strategy** (28% ROI, 59% win rate)
- **Threshold Theory** (U-shaped inefficiency patterns)
- **Universal Edge Amplifier** (+11.09% ROI boost across strategies)

## 🏗️ Architecture

### Core Services Architecture

The system uses a **shared services pattern** with three core services:

1. **SharedBrowserService** (`src/core/shared-browser.service.ts`) - Centralized browser management
2. **BettingUtilitiesService** (`src/core/betting-utilities.service.ts`) - Common betting logic
3. **DataFileService** (`src/core/data-file.service.ts`) - File-based communication hub

### Live Trading Services

4. **OddsMonitorService** (`src/live-trading/odds-monitor.service.ts`) - Real-time HKJC odds scraping
5. **BettingDecisionService** (`src/live-trading/betting-decision.service.ts`) - Strategy evaluation engine
6. **BettingExecutorService** (`src/live-trading/betting-executor.service.ts`) - Automated bet placement
7. **ResultsTrackerService** (`src/live-trading/results-tracker.service.ts`) - P&L monitoring

### Factor Drilling Integration

8. **AnalysisController** (`src/analysis/analysis.controller.ts`) - Factor drilling interface

All services communicate via **file-based JSON exchange** in `data/v2/` with **isolated browser instances** to prevent conflicts.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configuration

Create `config/live-betting.json` with your HKJC credentials:

```json
{
  "hkjcCredentials": {
    "username": "YOUR_HKJC_USERNAME",
    "password": "YOUR_HKJC_PASSWORD",
    "answers": {
      "你出生的醫院名稱是甚麼?": "YOUR_ANSWER",
      "你最喜愛的食物?": "YOUR_ANSWER",
      "你第一份工作的地點?": "YOUR_ANSWER",
      "你最喜愛的女藝人?": "YOUR_ANSWER",
      "你的駕駛執照有效期至?": "YOUR_ANSWER"
    }
  },
  "oddsMonitorInterval": 30000,
  "enableLiveBetting": false,
  "enablePaperTrading": true,
  "browser": {
    "headless": true,
    "timeout": 30000
  }
}
```

### 3. Start the System

```bash
# Start NestJS application with factor drilling
npm run start:dev

# Access factor drilling interface
# http://localhost:3000 (redirects to /analysis/drill-app)
```

### 4. Alternative Factor Drilling Access

```bash
# Start standalone factor drilling
cd ../..
node scripts/launch_dashboards.js

# Access at http://localhost:8888
```

## 📊 Data Flow

### File-Based Communication Chain

```
HKJC Website → OddsMonitorService → odds-data.json
                         ↓
BettingDecisionService → betting-decisions.json
                         ↓
BettingExecutorService → bet-record.json
                         ↓
ResultsTrackerService → system performance
```

### Shared Services Integration

```
SharedBrowserService → Isolated browser instances (ports 9224, 9225, 9226)
                  ↓
BettingUtilitiesService → Common betting logic + season collision prevention
                  ↓
DataFileService → File operations + configuration management
```

## 🎮 System Features

### File-Based Communication Benefits
- **Independent Operation** - Each service can run separately
- **Testable Components** - Easy to test individual services
- **Debugging** - All communication is visible in JSON files
- **Scalability** - Services can be distributed across machines
- **Data Persistence** - All data automatically saved to files

### Shared Services Benefits
- **Code Deduplication** - Eliminated ~60% of duplicated betting logic
- **Isolated Browser Instances** - Prevents conflicts between services
- **Centralized Configuration** - Single source of truth for settings
- **Season Collision Prevention** - Prevents catastrophic betting errors
- **Unified Error Handling** - Consistent error management across services

## 🔧 Configuration Options

### System Configuration (data/v2/system-config.json)

```json
{
  "enableLiveBetting": false,
  "enablePaperTrading": true,
  "mockMode": false,
  "oddsMonitorInterval": 30000
}
```

### Browser Configuration
- `headless` - Run browsers in headless mode (default: true)
- `timeout` - Browser operation timeout (default: 30000ms)
- `userDataDir` - Isolated profile directories per service
- `debuggingPort` - Unique debugging ports per service

## 🎲 Strategy System

The system automatically loads strategies from `DataFileService.getStrategies()`:

1. **Factor Evaluation** - All strategy factors must be satisfied
2. **Timing Check** - Bets placed 0-10 minutes before kickoff
3. **Duplicate Prevention** - Season-aware match keys prevent multiple bets
4. **Bet Execution** - Automated HKJC bet placement or paper trading

### Season Collision Prevention

**Critical Feature**: Prevents catastrophic betting errors by using season-aware match keys:

```typescript
// ❌ DANGEROUS - causes season collisions
const matchKey = `${homeTeam} v ${awayTeam}`;

// ✅ SAFE - prevents season collisions
const matchKey = `${season}_${homeTeam} v ${awayTeam}`;
```

## 💰 Variable Staking

Implements the proven tier-based variable staking system:

- Under $30k bankroll = $100 increment per 0.01 odds step
- $30k-$50k = $150 increment
- $50k-$100k = $200 increment
- $100k-$200k = $300 increment
- $200k+ = $450 increment

## 📈 Performance Tracking

The system tracks:

- **Real-time P&L** per strategy
- **Win rates and ROI** calculations
- **Daily, weekly, monthly** performance
- **System-wide metrics** and health monitoring

Results are saved to:
- `data/v2/bet-record.json` - All bet records (single source of truth)
- Strategy performance calculated in real-time
- System health monitoring through service status

## 🛡️ Safety Features

### Paper Trading Mode
- Test strategies without real money
- Full simulation with bet tracking
- Performance validation before going live

### Risk Management
- Maximum error thresholds
- Automatic system shutdown on critical errors
- Service health monitoring
- Graceful shutdown handling

### Betting Accuracy
- **Shared browser instances** with isolated profiles
- **Season collision prevention** with standardized match keys
- **Bet validation** through BettingUtilitiesService
- **Error recovery** with retry logic and fallback mechanisms

## 🔍 Monitoring

### Service Status
Each service provides status information:

```typescript
// Example service status
{
  isLoggedIn: boolean,
  liveBettingEnabled: boolean,
  paperTradingEnabled: boolean,
  duplicatePrevention: {
    enabled: true,
    placedBetsCount: number,
    placedBets: string[]
  }
}
```

### Health Checks
- Browser instance connectivity
- File system operations
- Service initialization status
- Error rate tracking

## 📁 File Structure

```
src/v2/
├── core/
│   ├── shared-browser.service.ts      # Centralized browser management
│   ├── betting-utilities.service.ts   # Common betting logic
│   └── data-file.service.ts           # File-based communication
├── live-trading/
│   ├── odds-monitor.service.ts        # HKJC odds scraping
│   ├── betting-decision.service.ts    # Strategy evaluation
│   ├── betting-executor.service.ts    # Bet placement
│   └── results-tracker.service.ts     # P&L monitoring
├── analysis/
│   └── analysis.controller.ts         # Factor drilling interface
├── app.module.ts                      # NestJS module configuration
├── app.controller.ts                  # Root redirect controller
└── nestjs-main.ts                     # Application entry point

data/v2/
├── odds-data.json                     # Live HKJC odds
├── betting-decisions.json             # Strategy evaluation results
├── bet-record.json                    # Executed bet history
├── system-config.json                 # System configuration
└── browser-*/                         # Isolated browser profiles
```

## 🚨 Important Notes

### Major Architectural Changes
- **Removed coordinator system** - Simplified to direct file-based communication
- **Eliminated code duplication** - Shared services pattern implementation
- **Season collision prevention** - Mandatory for all match identification
- **Isolated browser management** - Prevents conflicts between services

### Factor Drilling Integration
- **Interactive interface** available at localhost:3000/analysis/drill-app
- **Real-time drilling** through factor combinations
- **Individual betting records** with complete match details
- **Navigation controls** (Reset, Back, Breadcrumb jumping)

### Performance Expectations
Based on PROJECT_STATUS.md breakthrough results:
- **Variable staking**: 27% profit improvement over fixed
- **HKJC strategies**: 28% ROI with 59% win rate
- **Universal amplifier**: +11.09% ROI boost across strategies

## 🔧 Development

### Adding New Strategies
1. Add strategy to `DataFileService.getStrategies()`
2. System automatically loads and evaluates new strategies
3. No code changes required

### Testing Services
```bash
npm run test        # Run tests
npm run start:dev   # Development mode with hot reload
```

### Service Development
1. Implement service class with `@Injectable()` decorator
2. Use dependency injection for shared services
3. Follow file-based communication patterns
4. Add proper error handling and status reporting

## 📞 Support

For issues or questions:
1. Check service status via health endpoints
2. Verify HKJC credentials and network connectivity
3. Review file-based communication logs
4. Check browser instance health and isolation

## ⚠️ Risk Disclaimer

This system is for educational and research purposes. Always:
- Start with paper trading mode
- Verify strategy performance over time
- Use appropriate bankroll management
- Monitor system health regularly
- Never risk more than you can afford to lose

---

**🚀 Ready to deploy your proven profitable strategies with systematic edge over betting markets using shared services architecture!**