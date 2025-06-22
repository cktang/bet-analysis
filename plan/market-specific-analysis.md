# Market-Specific Analysis Plan

## 1. ODD/EVEN GOALS MARKET

### Market Characteristics
- **Payout**: Usually close to 50/50 (around 1.90-1.95 odds each)
- **Sample**: All completed matches regardless of score
- **Variance**: Relatively low variance, high volume market

### Key Influencing Factors

#### Team-Level Factors
- **Average Goals Per Game**: Teams that consistently score/concede similar amounts
- **Goal Distribution Patterns**: Some teams have more 1-0, 2-1 results (odd) vs 0-0, 2-0 (even)
- **Playing Style**: Defensive teams = more 0-0, 1-0 (even/odd split)

#### Match-Level Factors  
- **Derby/Rivalry Games**: Often cagey, lower scoring = favor even
- **Importance Level**: High-stakes games tend to be more cautious
- **Weather**: Rain/wind can reduce goals = slightly favor even
- **Time of Season**: Late season with nothing to play for = unpredictable

#### Statistical Patterns to Analyze
```
Hypothesis: Some teams consistently produce odd/even goal games
- Calculate each team's odd/even ratio over last 2 seasons
- Test if ratio significantly differs from 50% (chi-square test)
- Look for home/away splits in odd/even patterns
- Analyze matchup combinations (attacking vs defensive teams)
```

### Analysis Plan
1. **Historical Distribution**: Calculate odd/even % for each team, home/away
2. **Matchup Matrix**: How different team combinations perform  
3. **Seasonal Trends**: Early vs mid vs late season patterns
4. **Referee Impact**: Do certain refs influence goal totals systematically?

---

## 2. OVER/UNDER GOALS MARKET

### Market Characteristics
- **Most Popular Lines**: 2.5, 3.5 goals (focus on these)
- **Bookmaker Edge**: Typically 5-8% margin
- **Public Bias**: Casual bettors favor overs (entertainment value)

### Key Influencing Factors

#### Team Strength Metrics
- **xG For + xG Against**: Best predictor of true goal potential
- **Recent Form**: Last 6 games more predictive than season average
- **Head-to-Head History**: Some matchups consistently high/low scoring

#### Situational Factors
- **Home Advantage**: Home teams average 0.3-0.5 more goals
- **Rest Days**: Tired teams defend worse, score less efficiently  
- **League Position**: Top 6 vs bottom 6 games often higher scoring
- **Nothing to Play For**: End of season dead rubbers can be chaotic

#### Environmental Factors
- **Weather**: Rain reduces goals by ~0.3 per game on average
- **Pitch Conditions**: Poor pitches favor under totals
- **Referee Style**: Lenient refs = more goals (fewer interruptions)

### Statistical Models to Build

#### Poisson Regression Model
```
Goals ~ xG_Home + xG_Away + Home_Advantage + Rest_Days + Weather + Referee_Factor
```

#### Market Efficiency Tests
- Compare our predictions vs closing odds
- Find systematic overpricing of unders due to public bias
- Identify specific situations where model significantly differs from market

### Analysis Plan
1. **Build Predictive Model**: Use xG, form, situational factors
2. **Backtest on Historical Data**: Test model performance vs actual results
3. **Market Bias Analysis**: Find systematic over/under mispricing patterns
4. **Live Implementation**: Daily odds comparison vs model predictions

---

## 3. ASIAN HANDICAP MARKET

### Market Characteristics  
- **Eliminates Draw**: Only two outcomes (team wins on handicap or doesn't)
- **Half-Goal Lines**: -0.5, -1.5, -2.5 eliminate pushes
- **Lower Margins**: Typically 3-5% bookmaker edge

### Key Influencing Factors

#### Team Quality Differential
- **xG Difference**: Best measure of true team strength gap
- **Recent Form Divergence**: Teams moving in opposite directions
- **Motivation Mismatch**: One team needs points more than other

#### Match Context
- **Home Field Advantage**: Worth ~0.3-0.5 goals on average in EPL
- **Head-to-Head Records**: Some teams have psychological edges
- **Playing Styles**: Attacking vs defensive approach matchups

#### Line Shopping Opportunities
- **Market Movement**: Early vs closing line differences
- **Bookmaker Variations**: Different handicap lines available
- **Asian vs European Books**: Pricing discrepancies

### Strategic Approaches

#### Regression to Mean Strategy
```
Target: Teams on extreme winning/losing streaks
Logic: Performance tends to normalize over time
Analysis: Find teams significantly outperforming xG metrics
```

#### Motivation Edge Strategy  
```
Target: Matches with mismatched motivations
Examples: 
- Team fighting relegation vs mid-table team
- European qualification race vs nothing to play for
- Title contender vs already-relegated team
```

#### Form Momentum Strategy
```
Target: Teams showing clear upward/downward trends
Metrics: Last 6 games xG trends vs season averages
Signal: Team improving faster than market recognition
```

### Analysis Plan
1. **Build xG-Based Power Rankings**: True team strength adjusted for form
2. **Identify Market Inefficiencies**: Where odds don't match our ratings
3. **Situational Bias Detection**: Specific scenarios where market systematically wrong
4. **Hedging Opportunities**: Live betting adjustments during matches

---

## INTEGRATED ANALYSIS APPROACH

### Cross-Market Correlations
- Teams that cover handicaps often go over goal totals
- High-scoring games more likely to have odd total goals
- Weather affects all markets similarly

### Portfolio Approach
- Never bet all three markets on same game (correlation risk)
- Diversify across different matchdays and leagues
- Balance high-confidence single bets with lower-risk combinations

### Technology Integration
- Automated data collection from multiple sources
- Real-time odds monitoring and alert system  
- Backtesting platform for strategy validation
- Live tracking of bet performance and ROI

This market-specific analysis will help identify the most profitable opportunities in each betting category while managing risk through diversification and systematic approaches. 