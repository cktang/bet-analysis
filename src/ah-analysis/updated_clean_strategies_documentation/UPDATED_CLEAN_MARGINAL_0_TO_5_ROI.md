# UPDATED CLEAN MARGINAL 0 TO 5 ROI

## 📊 Tier Summary
- **Updated Clean Strategy Count**: 6
- **Average ROI**: 1.44%

## 1. Single_titleRacePressure

**Performance:**
- 💰 ROI: 4.23%
- 📊 Correlation: 0.0704
- 🎯 Accuracy: 52.2%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- 💡 Hypothesis: Combined title race pressure - HIGH values for top teams (profitable strategy - renamed from relegationPressure) predicts AH outcomes

**Clean Factor Breakdown:**
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Recommendation:**
🔍 **RESEARCH PHASE** - Monitor performance

---
## 2. Single_streakDifferential

**Performance:**
- 💰 ROI: 2.45%
- 📊 Correlation: 0.0250
- 🎯 Accuracy: 51.7%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)
- 💡 Hypothesis: Current streak differential (home - away) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Recommendation:**
🔍 **RESEARCH PHASE** - Monitor performance

---
## 3. Single_match_under2_5Odds

**Performance:**
- 💰 ROI: 0.86%
- 📊 Correlation: 0.0426
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 845

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.under2_5Odds
- 💡 Hypothesis: match.under2_5Odds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.under2_5Odds`

**Implementation Recommendation:**
🔍 **RESEARCH PHASE** - Monitor performance

---
## 4. Over_Under_Correlation

**Performance:**
- 💰 ROI: 0.61%
- 📊 Correlation: 0.0249
- 🎯 Accuracy: 49.5%
- 📈 Sample Size: 493

**Strategy Details:**
- 🏷️ Type: scoring_style
- 🧠 Verified Clean Factors: ((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2, match.over2_5Odds
- 💡 Hypothesis: Team over/under patterns affect game flow and AH outcomes

**Clean Factor Breakdown:**
  - `((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2`
  - `match.over2_5Odds`

**Implementation Recommendation:**
🔍 **RESEARCH PHASE** - Monitor performance

---
## 5. CrossRule_streakDifferential_x_homeWinOdds

**Performance:**
- 💰 ROI: 0.32%
- 📊 Correlation: 0.0612
- 🎯 Accuracy: 49.5%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0), match.homeWinOdds
- 💡 Hypothesis: Current streak differential (home - away) combined with 1X2 home win odds

**Clean Factor Breakdown:**
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `match.homeWinOdds`

**Implementation Recommendation:**
🔍 **RESEARCH PHASE** - Monitor performance

---
## 6. Streak_Length_Disparity

**Performance:**
- 💰 ROI: 0.16%
- 📊 Correlation: 0.0568
- 🎯 Accuracy: 50.0%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: momentum_contrast
- 🧠 Verified Clean Factors: Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))
- 💡 Hypothesis: Large differences in current streak lengths indicate value opportunities

**Clean Factor Breakdown:**
  - `Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))`

**Implementation Recommendation:**
🔍 **RESEARCH PHASE** - Monitor performance

---
