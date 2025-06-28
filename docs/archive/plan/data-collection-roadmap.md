# Data Collection Roadmap

## Current Data Assessment

### ✅ Strong Foundation (Already Have)
- **Match Results**: Complete historical EPL data 2021-2025
- **Expected Goals (xG)**: FBRef integration for true performance metrics
- **Odds Data**: OddsPortal historical and movement data
- **Basic Match Info**: Date, time, venue, referee, attendance

### ❌ Critical Missing Data Points

## TIER 1: HIGHEST IMPACT DATA (Immediate Priority)

### 1. Team News & Lineups
**Impact**: 🔥🔥🔥 CRITICAL - Can swing odds by 10-20%
**Sources**:
- Official club websites (automated scraping)
- Premier League API
- Sky Sports team news
- Social media monitoring (club Twitter accounts)

**Key Metrics**:
```
- Starting XI vs predicted lineup
- Key player availability (top scorers, defenders)
- Goalkeeper changes (backup keepers = more goals)
- Formation changes from usual setup
- Manager rotation patterns
```

### 2. Weather Data
**Impact**: 🔥🔥 HIGH - Affects total goals significantly
**Sources**:
- OpenWeatherMap API
- BBC Weather API  
- Weather Underground

**Key Metrics**:
```
- Temperature (extreme cold/heat affects performance)
- Wind speed (>15mph reduces goal accuracy)
- Precipitation (rain = fewer goals, slippery conditions)
- Visibility (fog affects passing accuracy)
```

### 3. Referee Analysis
**Impact**: 🔥🔥 HIGH - Different ref styles affect game flow
**Sources**: 
- Premier League referee statistics
- Transfermarkt referee data
- Historical match analysis

**Key Metrics**:
```  
- Average goals per game by referee
- Cards per game (more cards = more disruption)
- Penalty frequency
- Added time patterns
- Big club bias tendencies
```

## TIER 2: MEDIUM IMPACT DATA (Next Priority)

### 4. Injury & Suspension Tracking  
**Impact**: 🔥 MEDIUM - Affects team selection significantly
**Sources**:
- Official injury reports
- Fantasy Premier League API (injury flags)
- PhysioRoom.com
- Medical staff social media

**Key Metrics**:
```
- Days since injury return (fitness levels)
- Suspension lengths and return dates  
- Squad depth in each position
- Injury-prone player status
```

### 5. Travel & Rest Analysis
**Impact**: 🔥 MEDIUM - Fixture congestion affects performance  
**Sources**:
- Fixture scheduling data
- European competition schedules
- Travel distance calculations

**Key Metrics**:
```
- Days rest between matches
- European competition midweek games
- Travel distance for away games
- Time zone changes (rare in EPL)
```

### 6. Motivation Factors
**Impact**: 🔥 MEDIUM - Psychological edge in betting
**Sources**:
- League table calculations
- Historical analysis
- Media sentiment analysis

**Key Metrics**:
```
- Points needed for European qualification
- Relegation battle positioning  
- Title race scenarios
- Derby match importance
- Manager pressure (recent results)
```

## TIER 3: SUPPLEMENTARY DATA (Future Enhancement)

### 7. Social Media Sentiment
**Impact**: 🔥 LOW-MEDIUM - Market sentiment indicator
**Sources**:
- Twitter API monitoring
- Reddit sentiment analysis
- Betting forum discussions

### 8. Transfer Activity Impact  
**Impact**: 🔥 LOW - New signings adaptation time
**Sources**:
- Transfer databases
- Squad integration analysis

### 9. Historical Head-to-Head Patterns
**Impact**: 🔥 LOW - Some psychological effects
**Sources**: 
- Extended historical database
- Matchup-specific analysis

## DATA COLLECTION IMPLEMENTATION PLAN

### Phase 1: Foundation (Weeks 1-2)
```javascript
// Immediate priorities for new season preparation
1. Set up weather API integration
2. Build referee database and analysis
3. Create team news scraping system
4. Implement lineup comparison algorithms
```

### Phase 2: Automation (Weeks 3-4)  
```javascript
// Automated daily data collection
1. Weather data collection 24hrs before each match
2. Team news monitoring (12hrs, 2hrs before kickoff)  
3. Lineup confirmation system
4. Referee assignment tracking
```

### Phase 3: Analysis Integration (Weeks 5-6)
```javascript
// Incorporate new data into betting models
1. Weather impact coefficients
2. Key player absence adjustments  
3. Referee style multipliers
4. Motivation index calculations
```

## DATA SOURCES & APIs

### Free APIs (Start Here)
- **OpenWeatherMap**: Weather data (1000 calls/month free)
- **Premier League**: Official fixtures and basic stats
- **FPL API**: Fantasy data includes injury flags
- **SportMonks**: Basic match data (limited free tier)

### Paid APIs (If Profitable)
- **Football-Data.org**: €50/month comprehensive data
- **API-Football**: $10/month extensive coverage  
- **Stats Perform**: Professional-grade data (expensive)

### Web Scraping Targets
- Sky Sports team news pages
- BBC Sport match previews  
- Club official websites
- Referee assignment pages

## QUALITY CONTROL MEASURES

### Data Validation
```python
# Example validation checks
- Cross-reference team news from multiple sources
- Verify weather data accuracy with match reports
- Check referee assignments against official sources
- Validate lineup data with post-match reports
```

### Update Frequency
- **Team News**: Every 2 hours on match days
- **Weather**: Every 6 hours, final check 2hrs before kickoff
- **Odds**: Real-time monitoring for value bets
- **Referee**: Weekly updates when assignments released

## ROI IMPACT PROJECTIONS

### Expected Improvements with New Data
- **Weather Integration**: +2-3% ROI improvement on total goals bets
- **Team News**: +5-8% ROI improvement on all markets
- **Referee Analysis**: +1-2% ROI improvement across all bets  
- **Combined Effect**: Target 8-12% overall ROI improvement

### Break-Even Analysis
```
Monthly API costs: ~$100-200
Additional development time: 40-60 hours  
Required ROI improvement: 3-5% to justify investment
Expected ROI improvement: 8-12% = highly profitable
```

This roadmap prioritizes the data collection efforts that will have the biggest impact on our betting profitability, starting with the most critical information that affects match outcomes. 