# UPDATED CLEAN STRONG 20 TO 50 ROI

## 📊 Tier Summary
- **Updated Clean Strategy Count**: 17
- **Average ROI**: 30.83%

## 1. Position_vs_Goal_Difference

**Performance:**
- 💰 ROI: 49.96%
- 📊 Correlation: 0.3691
- 🎯 Accuracy: 67.0%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: performance_vs_position
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20), (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- 💡 Hypothesis: League position vs goal difference reveals over/underperforming teams

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 2. Momentum_Clash

**Performance:**
- 💰 ROI: 49.61%
- 📊 Correlation: 0.3567
- 🎯 Accuracy: 67.4%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: momentum_differential
- 🧠 Verified Clean Factors: (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0), (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- 💡 Hypothesis: Teams with opposing momentum create predictable Asian Handicap value

**Clean Factor Breakdown:**
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 3. Single_goalDiffMomentum

**Performance:**
- 💰 ROI: 48.50%
- 📊 Correlation: 0.3512
- 🎯 Accuracy: 67.0%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- 💡 Hypothesis: Goal difference momentum comparison predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 4. Single_homeGoalDiff

**Performance:**
- 💰 ROI: 37.02%
- 📊 Correlation: 0.2769
- 🎯 Accuracy: 60.3%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.cumulative.overall.goalDifference || 0
- 💡 Hypothesis: Home team cumulative goal difference predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.cumulative.overall.goalDifference || 0`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 5. Single_awayPosition

**Performance:**
- 💰 ROI: 29.75%
- 📊 Correlation: 0.2083
- 🎯 Accuracy: 55.4%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.leaguePosition || 20
- 💡 Hypothesis: Away team current league position predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.leaguePosition || 20`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 6. Single_homeWinStreak

**Performance:**
- 💰 ROI: 29.55%
- 📊 Correlation: 0.2384
- 🎯 Accuracy: 56.8%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.longest.win || 0
- 💡 Hypothesis: Home team longest win streak this season predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.longest.win || 0`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 7. Single_enhanced_marketEfficiency_drawImpliedProb

**Performance:**
- 💰 ROI: 29.21%
- 📊 Correlation: 0.1677
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.marketEfficiency.drawImpliedProb
- 💡 Hypothesis: enhanced.marketEfficiency.drawImpliedProb directly predicts AH profit

**Clean Factor Breakdown:**
  - `enhanced.marketEfficiency.drawImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 8. Top_vs_Bottom

**Performance:**
- 💰 ROI: 28.88%
- 📊 Correlation: 0.2777
- 🎯 Accuracy: 56.0%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: tier_clash
- 🧠 Verified Clean Factors: (timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0, (timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0
- 💡 Hypothesis: Top 6 vs bottom 3 matchups show market inefficiencies

**Clean Factor Breakdown:**
  - `(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0`
  - `(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 9. Single_homeTopSix

**Performance:**
- 💰 ROI: 28.24%
- 📊 Correlation: 0.2432
- 🎯 Accuracy: 56.0%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0
- 💡 Hypothesis: Home team in top 6 positions (European spots) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 10. Mid_Table_Mediocrity

**Performance:**
- 💰 ROI: 26.24%
- 📊 Correlation: 0.1632
- 🎯 Accuracy: 56.7%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: motivation_vacuum
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) > 8 && (timeSeries.home.leaguePosition || 20) < 16 && (timeSeries.away.leaguePosition || 20) > 8 && (timeSeries.away.leaguePosition || 20) < 16) ? 1 : 0, match.drawOdds
- 💡 Hypothesis: Safe mid-table teams produce more unpredictable results

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) > 8 && (timeSeries.home.leaguePosition || 20) < 16 && (timeSeries.away.leaguePosition || 20) > 8 && (timeSeries.away.leaguePosition || 20) < 16) ? 1 : 0`
  - `match.drawOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 11. Single_awayImpliedProb

**Performance:**
- 💰 ROI: 25.79%
- 📊 Correlation: 0.4082
- 🎯 Accuracy: 60.8%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.awayImpliedProb
- 💡 Hypothesis: Implied probability of away win from odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 12. Win_Odds_Ratio

**Performance:**
- 💰 ROI: 25.27%
- 📊 Correlation: 0.3238
- 🎯 Accuracy: 60.4%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.homeWinOdds / match.awayWinOdds
- 💡 Hypothesis: Home vs away win odds ratio indicates market sentiment

**Clean Factor Breakdown:**
  - `match.homeWinOdds / match.awayWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 13. AH_vs_1X2_Comparison

**Performance:**
- 💰 ROI: 24.74%
- 📊 Correlation: 0.3420
- 🎯 Accuracy: 60.1%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: cross_market
- 🧠 Verified Clean Factors: match.asianHandicapOdds.homeOdds, match.homeWinOdds
- 💡 Hypothesis: Asian Handicap vs 1X2 odds comparison reveals value

**Clean Factor Breakdown:**
  - `match.asianHandicapOdds.homeOdds`
  - `match.homeWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 14. Single_homeWinOdds

**Performance:**
- 💰 ROI: 24.52%
- 📊 Correlation: 0.3432
- 🎯 Accuracy: 59.9%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.homeWinOdds
- 💡 Hypothesis: 1X2 home win odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `match.homeWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 15. CrossRule_homeImpliedProb_x_homeWinOdds

**Performance:**
- 💰 ROI: 24.52%
- 📊 Correlation: 0.3241
- 🎯 Accuracy: 59.9%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.homeImpliedProb, match.homeWinOdds
- 💡 Hypothesis: Implied probability of home win from odds combined with 1X2 home win odds

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`
  - `match.homeWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 16. Single_drawOdds

**Performance:**
- 💰 ROI: 21.25%
- 📊 Correlation: 0.1682
- 🎯 Accuracy: 54.0%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.drawOdds
- 💡 Hypothesis: 1X2 draw odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `match.drawOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 17. Single_handicapLine

**Performance:**
- 💰 ROI: 21.06%
- 📊 Correlation: 0.3927
- 🎯 Accuracy: 58.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])
- 💡 Hypothesis: Asian Handicap line value predicts AH outcomes

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
