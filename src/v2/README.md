# Live Betting System V2 - Fully Automated

A fully automated betting system that runs in the background with zero manual intervention. The system automatically loads daily fixtures, monitors for trading windows (5-10 minutes before kickoff), and executes the complete trading cycle.

## 🎯 Overview

This system implements the breakthrough discoveries from your PROJECT_STATUS.md:
- **Variable Staking System** (27% profit improvement)
- **HKJC Quarter Handicap Strategy** (28% ROI, 59% win rate)
- **Threshold Theory** (U-shaped inefficiency patterns)
- **Universal Edge Amplifier** (+11.09% ROI boost across strategies)

## 🏗️ Architecture

The system consists of 4 main independent services:

1. **Odds Monitor** (`src/live-trading/odds-monitor.service.ts`) - Real-time HKJC odds scraping
2. **Strategy Decision Engine** (`src/live-trading/strategy-decision.service.ts`) - Pre-match factor analysis
3. **Betting Executor** (`src/live-trading/betting-executor.service.ts`) - Improved bet placement
4. **Results Tracker** (`src/live-trading/results-tracker.service.ts`) - P&L monitoring

Each service is completely independent and communicates via JSON files in `data/v2/`.

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
  "enablePaperTrading": true
}
```

### 3. Start the System

```bash
npm run live-betting
```

## 📊 Data Flow

```
HKJC Website → Odds Monitor → odds-data.json
                    ↓
Strategy Decision Engine → betting-decisions.json
                    ↓
Betting Executor → bet-execution-results.json
                    ↓
Results Tracker → bet-results.json
```

### File-Based Communication

Services communicate exclusively through JSON files:
- **Independent Operation** - Each service can run separately
- **Testable Components** - Easy to test individual services
- **Debugging** - All communication is visible in JSON files
- **Scalability** - Services can be distributed across machines

## 🎮 Commands

Once running, you can use these commands:

- `status` - Show system status
- `metrics` - Show detailed performance metrics
- `update` - Manual results update
- `live on/off` - Enable/disable live betting
- `paper on/off` - Enable/disable paper trading
- `restart` - Restart the system
- `stop` - Stop the system

## 🔧 Configuration Options

### Environment Variables

Alternatively, use environment variables:

```bash
export HKJC_USERNAME="your_username"
export HKJC_PASSWORD="your_password"
export HKJC_SECURITY_ANSWERS='{"question1": "answer1", "question2": "answer2"}'
export ODDS_MONITOR_INTERVAL=30000
export ENABLE_LIVE_BETTING=false
export ENABLE_PAPER_TRADING=true
```

### System Configuration

- `oddsMonitorInterval` - How often to check odds (milliseconds, default: 30000)
- `enableLiveBetting` - Enable real money betting (default: false)
- `enablePaperTrading` - Enable paper trading mode (default: true)

## 🎲 Strategy System

The system automatically loads strategies from `src/pattern-discovery/strategy.json`. Each strategy is evaluated independently:

1. **Factor Evaluation** - All strategy factors must be satisfied
2. **Timing Check** - Bets placed 5-10 minutes before kickoff
3. **Risk Assessment** - Confidence scoring and stake calculation
4. **Bet Execution** - Automated HKJC bet placement

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
- `data/results/bet_records.json` - All bet records
- `data/results/strategy_performance.json` - Strategy metrics
- `data/results/system_summary.json` - Overall performance

## 🛡️ Safety Features

### Paper Trading Mode
- Test strategies without real money
- Full simulation with bet tracking
- Performance validation before going live

### Risk Management
- Maximum error thresholds
- Automatic system shutdown on critical errors
- Module health monitoring
- Graceful shutdown handling

### Betting Accuracy
- **Improved checkbox targeting** - Fixes home/away confusion
- **Multiple selector strategies** - Robust element finding
- **Bet verification** - Confirms correct selection before placement
- **Error recovery** - Retry logic and fallback mechanisms

## 🔍 Monitoring

### Real-time Alerts
The system emits alerts for:
- Module status changes
- Betting signals and placements
- System errors and warnings
- Performance anomalies

### Health Checks
- Module connectivity status
- Activity monitoring
- Performance metrics
- Error rate tracking

## 📁 File Structure

```
src/
├── coordinator/
│   ├── EventBus.ts              # Central communication hub
│   └── LiveBettingCoordinator.ts # Main orchestrator
├── monitoring/
│   └── OddsMonitor.ts           # HKJC odds scraping
├── data/
│   └── EnhancedDataBuilder.ts   # Real-time enhanced data
├── decision/
│   └── StrategyDecisionEngine.ts # Strategy evaluation
├── execution/
│   └── HKJCBettingExecutor.ts   # Bet placement
├── tracking/
│   └── ResultsTracker.ts        # P&L monitoring
└── main.ts                      # Entry point

data/
├── live/                        # Live system state
├── results/                     # Performance tracking
├── enhanced/                    # Enhanced match data
└── odds-movement/              # Historical odds
```

## 🚨 Important Notes

### HKJC Betting Improvements
The V2 betting executor addresses critical issues from V1:
- **Enhanced checkbox targeting** with multiple fallback strategies
- **Bet side verification** to prevent home/away confusion
- **Context-aware selection** with team name validation
- **Error recovery** and retry mechanisms

### Data Compatibility
Enhanced data builder generates data compatible with existing strategy system:
- Same JSON structure as `data/enhanced/`
- Real-time factor evaluation
- Seamless integration with pattern discovery

### Performance Expectations
Based on PROJECT_STATUS.md breakthrough results:
- **Variable staking**: 27% profit improvement over fixed
- **HKJC strategies**: 28% ROI with 59% win rate
- **Universal amplifier**: +11.09% ROI boost across strategies

## 🔧 Development

### Adding New Strategies
1. Add strategy to `src/pattern-discovery/strategy.json`
2. System automatically loads and evaluates new strategies
3. No code changes required

### Adding New Modules
1. Implement module class
2. Register with EventBus for communication
3. Add to LiveBettingCoordinator startup sequence

### Testing
```bash
npm run test        # Run tests
npm run dev        # Development mode with hot reload
```

## 📞 Support

For issues or questions:
1. Check system logs and status commands
2. Verify HKJC credentials and network connectivity
3. Review strategy performance metrics
4. Check module health status

## ⚠️ Risk Disclaimer

This system is for educational and research purposes. Always:
- Start with paper trading mode
- Verify strategy performance over time
- Use appropriate bankroll management
- Monitor system health regularly
- Never risk more than you can afford to lose

---

**🚀 Ready to deploy your proven profitable strategies with systematic edge over betting markets!**