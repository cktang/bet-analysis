# Value Betting System: Pinnacle vs HKJC Arbitrage

## Overview
A systematic approach to identify value betting opportunities by comparing odds between Pinnacle (sharp benchmark) and HKJC (potentially softer pricing) on Asian Handicap markets.

## Core Strategy

### Value Betting Framework
1. **Benchmark**: Use Pinnacle's odds as "true probability" after removing margin
2. **Opportunity**: Find HKJC odds that offer better value than fair market price
3. **Execution**: Bet when Expected Value (EV) exceeds minimum threshold

### Key Assumptions
- Pinnacle has most efficient pricing (2-3% margin)
- HKJC may have market inefficiencies due to local bias
- Speed of execution is critical

## System Architecture

### Real-time Monitoring
- **Multiple Browser Instances**: Active monitoring of both platforms
- **Odds Change Detection**: Real-time alerts on significant movements
- **Data Pipeline**: Continuous collection and comparison

### Technical Components
1. **Odds Scrapers** (Playwright-based)
2. **Probability Calculator** (Margin removal)
3. **Value Detector** (EV calculation)
4. **Alert System** (Opportunity notifications)
5. **Risk Manager** (Position sizing)

## Implementation Phases

### Phase 1: Data Collection
- Set up monitoring for both platforms
- Historical odds analysis
- Market pattern identification

### Phase 2: Strategy Development
- EV calculation algorithms
- Risk management rules
- Betting criteria validation

### Phase 3: Live Trading
- Real-time execution
- Performance tracking
- Strategy refinement

## Risk Management
- Minimum 3-5% EV threshold
- Kelly Criterion position sizing
- Diversification across matches
- Stop-loss mechanisms

## Success Metrics
- ROI percentage
- Hit rate accuracy
- Average edge captured
- Risk-adjusted returns

## Next Steps
1. Build odds monitoring system
2. Implement probability calculations
3. Create alerting mechanism
4. Test with paper trading
5. Scale to live betting

---
*This system requires careful legal and regulatory compliance in target jurisdictions.* 