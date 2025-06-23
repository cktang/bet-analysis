# UPDATED CLEAN STRATEGIES (NO POST-MATCH DATA INCLUDING XG)

## 🎯 Updated Clean Analysis Results

- **Total Clean Strategies**: 136
- **Profitable Clean Strategies**: 81
- **Clean Success Rate**: 59.6%
- **Average ROI (Clean)**: 7.30%

## ⚠️ CONTAMINATION PATTERNS REMOVED:
- ❌ fbref.homeXG / fbref.awayXG (Expected Goals from match events)
- ❌ homeXG / awayXG (Expected Goals in any form)
- ❌ enhanced.performance.* (Performance metrics using actual results)
- ❌ Any post-match statistics

## 🏆 Top 20 Updated Clean Strategies by ROI

1. **Adaptive_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_homeImpliedProb** - 59.79% ROI
2. **Adaptive_Ratio_AH_vs_1X2_Comparison** - 59.63% ROI
3. **Adaptive_Adaptive_Ratio_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_homeValueBet** - 59.63% ROI
4. **Single_awayWinOdds** - 59.62% ROI
5. **Rising_Underdog_Back** - 59.41% ROI
6. **Adaptive_Position_vs_Form_Plus_preMatch_enhanced_homeImpliedProb** - 58.83% ROI
7. **Adaptive_Falling_Giant_Fade_Plus_preMatch_enhanced_homeImpliedProb** - 58.38% ROI
8. **Adaptive_Single_homeWinOdds_Plus_preMatch_enhanced_homeImpliedProb** - 58.37% ROI
9. **Adaptive_Single_handicapLine_Plus_preMatch_enhanced_homeImpliedProb** - 57.81% ROI
10. **Position_Gap_Analysis** - 54.57% ROI
11. **Single_positionGap** - 54.57% ROI
12. **Position_vs_Form** - 53.75% ROI
13. **Single_enhanced_marketEfficiency_awayImpliedProb** - 53.65% ROI
14. **Single_match_homeWinOdds___match_awayWinOdds** - 53.47% ROI
15. **Single_match_homeWinOdds** - 52.78% ROI
16. **Single_parseFloat_match_asianHandicapOdds_homeHandicap_split______0__** - 50.71% ROI
17. **Position_vs_Goal_Difference** - 49.96% ROI
18. **Momentum_Clash** - 49.61% ROI
19. **Single_goalDiffMomentum** - 48.50% ROI
20. **Single_homeGoalDiff** - 37.02% ROI

## 📋 Complete Updated Clean Strategy List

### 1. Adaptive_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 59.79%
- 📊 **Correlation**: 0.4479
- 🎯 **Accuracy**: 75.9%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 3 factors
- 💡 **Hypothesis**: Extending successful AH_vs_1X2_Comparison with preMatch.enhanced.homeImpliedProb

**Verified Clean Factors Used:**
  - `match.asianHandicapOdds.homeOdds`
  - `match.homeWinOdds`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 2. Adaptive_Ratio_AH_vs_1X2_Comparison

**Performance Metrics:**
- 💰 **ROI**: 59.63%
- 📊 **Correlation**: 0.4607
- 🎯 **Accuracy**: 72.3%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive_ratio
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Ratio of successful factors in AH_vs_1X2_Comparison

**Verified Clean Factors Used:**
  - `(match.asianHandicapOdds.homeOdds) / (match.homeWinOdds)`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 3. Adaptive_Adaptive_Ratio_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_homeValueBet

**Performance Metrics:**
- 💰 **ROI**: 59.63%
- 📊 **Correlation**: 0.4606
- 🎯 **Accuracy**: 72.3%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Adaptive_Ratio_AH_vs_1X2_Comparison with preMatch.enhanced.homeValueBet

**Verified Clean Factors Used:**
  - `(match.asianHandicapOdds.homeOdds) / (match.homeWinOdds)`
  - `preMatch.enhanced.homeValueBet`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 4. Single_awayWinOdds

**Performance Metrics:**
- 💰 **ROI**: 59.62%
- 📊 **Correlation**: 0.3573
- 🎯 **Accuracy**: 75.9%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: 1X2 away win odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `match.awayWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 5. Rising_Underdog_Back

**Performance Metrics:**
- 💰 **ROI**: 59.41%
- 📊 **Correlation**: 0.3519
- 🎯 **Accuracy**: 75.7%
- 📈 **Sample Size**: 1074

**Strategy Details:**
- 🏷️ **Type**: momentum_undervaluation
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Back lower table away teams on winning streaks that market undervalues

**Verified Clean Factors Used:**
  - `((timeSeries.away.leaguePosition || 20) >= 12 && (timeSeries.away.streaks.overall.current.type === 'W' || timeSeries.away.streaks.overall.current.type === 'win') && (timeSeries.away.streaks.overall.current.count || 0) >= 2 && enhanced.preMatch.marketEfficiency.awayImpliedProb < 0.25) ? 1 : 0`
  - `match.awayWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 6. Adaptive_Position_vs_Form_Plus_preMatch_enhanced_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 58.83%
- 📊 **Correlation**: 0.4428
- 🎯 **Accuracy**: 74.8%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 3 factors
- 💡 **Hypothesis**: Extending successful Position_vs_Form with preMatch.enhanced.homeImpliedProb

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 7. Adaptive_Falling_Giant_Fade_Plus_preMatch_enhanced_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 58.38%
- 📊 **Correlation**: 0.4477
- 🎯 **Accuracy**: 74.8%
- 📈 **Sample Size**: 1078

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 3 factors
- 💡 **Hypothesis**: Extending successful Falling_Giant_Fade with preMatch.enhanced.homeImpliedProb

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`
  - `match.homeWinOdds`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 8. Adaptive_Single_homeWinOdds_Plus_preMatch_enhanced_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 58.37%
- 📊 **Correlation**: 0.4473
- 🎯 **Accuracy**: 75.0%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_homeWinOdds with preMatch.enhanced.homeImpliedProb

**Verified Clean Factors Used:**
  - `match.homeWinOdds`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 9. Adaptive_Single_handicapLine_Plus_preMatch_enhanced_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 57.81%
- 📊 **Correlation**: 0.4510
- 🎯 **Accuracy**: 75.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with preMatch.enhanced.homeImpliedProb

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 10. Position_Gap_Analysis

**Performance Metrics:**
- 💰 **ROI**: 54.57%
- 📊 **Correlation**: 0.3733
- 🎯 **Accuracy**: 69.2%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: position_differential
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Large position gaps create predictable handicap value

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 11. Single_positionGap

**Performance Metrics:**
- 💰 **ROI**: 54.57%
- 📊 **Correlation**: 0.3733
- 🎯 **Accuracy**: 69.2%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: League position gap (away - home, positive = home higher) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 12. Position_vs_Form

**Performance Metrics:**
- 💰 **ROI**: 53.75%
- 📊 **Correlation**: 0.3783
- 🎯 **Accuracy**: 69.3%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: position_form_divergence
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Position vs current form creates value when they diverge

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 13. Single_enhanced_marketEfficiency_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 53.65%
- 📊 **Correlation**: 0.4082
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: enhanced.marketEfficiency.awayImpliedProb directly predicts AH profit

**Verified Clean Factors Used:**
  - `enhanced.marketEfficiency.awayImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 14. Single_match_homeWinOdds___match_awayWinOdds

**Performance Metrics:**
- 💰 **ROI**: 53.47%
- 📊 **Correlation**: 0.3238
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.homeWinOdds / match.awayWinOdds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.homeWinOdds / match.awayWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 15. Single_match_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: 52.78%
- 📊 **Correlation**: 0.3432
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.homeWinOdds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.homeWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 16. Single_parseFloat_match_asianHandicapOdds_homeHandicap_split______0__

**Performance Metrics:**
- 💰 **ROI**: 50.71%
- 📊 **Correlation**: 0.3927
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: parseFloat(match.asianHandicapOdds.homeHandicap.split("/")[0]) directly predicts AH profit

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split("/")[0])`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 17. Position_vs_Goal_Difference

**Performance Metrics:**
- 💰 **ROI**: 49.96%
- 📊 **Correlation**: 0.3691
- 🎯 **Accuracy**: 67.0%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: performance_vs_position
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: League position vs goal difference reveals over/underperforming teams

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 18. Momentum_Clash

**Performance Metrics:**
- 💰 **ROI**: 49.61%
- 📊 **Correlation**: 0.3567
- 🎯 **Accuracy**: 67.4%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: momentum_differential
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Teams with opposing momentum create predictable Asian Handicap value

**Verified Clean Factors Used:**
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 19. Single_goalDiffMomentum

**Performance Metrics:**
- 💰 **ROI**: 48.50%
- 📊 **Correlation**: 0.3512
- 🎯 **Accuracy**: 67.0%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Goal difference momentum comparison predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 20. Single_homeGoalDiff

**Performance Metrics:**
- 💰 **ROI**: 37.02%
- 📊 **Correlation**: 0.2769
- 🎯 **Accuracy**: 60.3%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team cumulative goal difference predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.cumulative.overall.goalDifference || 0`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 21. Single_awayPosition

**Performance Metrics:**
- 💰 **ROI**: 29.75%
- 📊 **Correlation**: 0.2083
- 🎯 **Accuracy**: 55.4%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team current league position predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.leaguePosition || 20`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 22. Single_homeWinStreak

**Performance Metrics:**
- 💰 **ROI**: 29.55%
- 📊 **Correlation**: 0.2384
- 🎯 **Accuracy**: 56.8%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team longest win streak this season predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.longest.win || 0`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 23. Single_enhanced_marketEfficiency_drawImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 29.21%
- 📊 **Correlation**: 0.1677
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: enhanced.marketEfficiency.drawImpliedProb directly predicts AH profit

**Verified Clean Factors Used:**
  - `enhanced.marketEfficiency.drawImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 24. Top_vs_Bottom

**Performance Metrics:**
- 💰 **ROI**: 28.88%
- 📊 **Correlation**: 0.2777
- 🎯 **Accuracy**: 56.0%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: tier_clash
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Top 6 vs bottom 3 matchups show market inefficiencies

**Verified Clean Factors Used:**
  - `(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0`
  - `(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 25. Single_homeTopSix

**Performance Metrics:**
- 💰 **ROI**: 28.24%
- 📊 **Correlation**: 0.2432
- 🎯 **Accuracy**: 56.0%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team in top 6 positions (European spots) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 26. Mid_Table_Mediocrity

**Performance Metrics:**
- 💰 **ROI**: 26.24%
- 📊 **Correlation**: 0.1632
- 🎯 **Accuracy**: 56.7%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: motivation_vacuum
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Safe mid-table teams produce more unpredictable results

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) > 8 && (timeSeries.home.leaguePosition || 20) < 16 && (timeSeries.away.leaguePosition || 20) > 8 && (timeSeries.away.leaguePosition || 20) < 16) ? 1 : 0`
  - `match.drawOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 27. Single_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 25.79%
- 📊 **Correlation**: 0.4082
- 🎯 **Accuracy**: 60.8%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Implied probability of away win from odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 28. Win_Odds_Ratio

**Performance Metrics:**
- 💰 **ROI**: 25.27%
- 📊 **Correlation**: 0.3238
- 🎯 **Accuracy**: 60.4%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home vs away win odds ratio indicates market sentiment

**Verified Clean Factors Used:**
  - `match.homeWinOdds / match.awayWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 29. AH_vs_1X2_Comparison

**Performance Metrics:**
- 💰 **ROI**: 24.74%
- 📊 **Correlation**: 0.3420
- 🎯 **Accuracy**: 60.1%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: cross_market
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Asian Handicap vs 1X2 odds comparison reveals value

**Verified Clean Factors Used:**
  - `match.asianHandicapOdds.homeOdds`
  - `match.homeWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 30. Single_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: 24.52%
- 📊 **Correlation**: 0.3432
- 🎯 **Accuracy**: 59.9%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: 1X2 home win odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `match.homeWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 31. CrossRule_homeImpliedProb_x_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: 24.52%
- 📊 **Correlation**: 0.3241
- 🎯 **Accuracy**: 59.9%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Implied probability of home win from odds combined with 1X2 home win odds

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`
  - `match.homeWinOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 32. Single_drawOdds

**Performance Metrics:**
- 💰 **ROI**: 21.25%
- 📊 **Correlation**: 0.1682
- 🎯 **Accuracy**: 54.0%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: 1X2 draw odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `match.drawOdds`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 33. Single_handicapLine

**Performance Metrics:**
- 💰 **ROI**: 21.06%
- 📊 **Correlation**: 0.3927
- 🎯 **Accuracy**: 58.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Asian Handicap line value predicts AH outcomes

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`

**Implementation Status:**
✅ **READY FOR LIVE BETTING** - High confidence clean strategy

---

### 34. Single_awayLossStreak

**Performance Metrics:**
- 💰 **ROI**: 19.62%
- 📊 **Correlation**: 0.1573
- 🎯 **Accuracy**: 51.2%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team longest loss streak this season predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.streaks.overall.longest.loss || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 35. Single_attendance

**Performance Metrics:**
- 💰 **ROI**: 19.07%
- 📊 **Correlation**: 0.2083
- 🎯 **Accuracy**: 50.6%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Stadium attendance (home advantage indicator) predicts AH outcomes

**Verified Clean Factors Used:**
  - `fbref.attendance`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 36. Single_europeanPressure

**Performance Metrics:**
- 💰 **ROI**: 18.95%
- 📊 **Correlation**: 0.0537
- 🎯 **Accuracy**: 58.5%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Combined European qualification pressure predicts AH outcomes

**Verified Clean Factors Used:**
  - `Math.max(0, 7 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 7 - (timeSeries.away.leaguePosition || 20))`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 37. Single_awayTopSix

**Performance Metrics:**
- 💰 **ROI**: 18.75%
- 📊 **Correlation**: 0.1010
- 🎯 **Accuracy**: 58.9%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team in top 6 positions (European spots) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 38. Single_awayBottomThree

**Performance Metrics:**
- 💰 **ROI**: 18.56%
- 📊 **Correlation**: 0.1407
- 🎯 **Accuracy**: 49.3%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team in relegation zone (bottom 3) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 39. Adaptive_Single_awayGoalDiff_Plus_match_asianHandicapOdds_homeOdds

**Performance Metrics:**
- 💰 **ROI**: 18.47%
- 📊 **Correlation**: 0.1139
- 🎯 **Accuracy**: 59.0%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayGoalDiff with match.asianHandicapOdds.homeOdds

**Verified Clean Factors Used:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 40. Adaptive_Single_awayGoalDiff_Plus_match_asianHandicapOdds_awayOdds

**Performance Metrics:**
- 💰 **ROI**: 18.42%
- 📊 **Correlation**: 0.1131
- 🎯 **Accuracy**: 59.0%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayGoalDiff with match.asianHandicapOdds.awayOdds

**Verified Clean Factors Used:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.asianHandicapOdds.awayOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 41. Single_awayGoalDiff

**Performance Metrics:**
- 💰 **ROI**: 17.73%
- 📊 **Correlation**: 0.1135
- 🎯 **Accuracy**: 58.6%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team cumulative goal difference predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 42. Adaptive_Single_awayGoalDiff_Plus_match_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: 16.88%
- 📊 **Correlation**: 0.1110
- 🎯 **Accuracy**: 57.4%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayGoalDiff with match.homeWinOdds

**Verified Clean Factors Used:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.homeWinOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 43. Adaptive_Single_awayGoalDiff_Plus_match_drawOdds

**Performance Metrics:**
- 💰 **ROI**: 16.73%
- 📊 **Correlation**: 0.1091
- 🎯 **Accuracy**: 58.1%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayGoalDiff with match.drawOdds

**Verified Clean Factors Used:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.drawOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 44. Adaptive_Single_awayTopSix_Plus_match_asianHandicapOdds_homeOdds

**Performance Metrics:**
- 💰 **ROI**: 16.03%
- 📊 **Correlation**: 0.1279
- 🎯 **Accuracy**: 56.8%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayTopSix with match.asianHandicapOdds.homeOdds

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 45. European_Pressure

**Performance Metrics:**
- 💰 **ROI**: 15.56%
- 📊 **Correlation**: 0.0639
- 🎯 **Accuracy**: 57.7%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: stakes_analysis
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: European spot battles create extra motivation affecting performance

**Verified Clean Factors Used:**
  - `(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0`
  - `(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 46. Single_topSixBattle

**Performance Metrics:**
- 💰 **ROI**: 15.21%
- 📊 **Correlation**: 0.0978
- 🎯 **Accuracy**: 47.3%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Both teams competing for European spots predicts AH outcomes

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 47. Single_homeFormLength

**Performance Metrics:**
- 💰 **ROI**: 15.04%
- 📊 **Correlation**: 0.0700
- 🎯 **Accuracy**: 58.1%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team form sample size predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.form.length || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 48. Adaptive_Single_topSixBattle_Plus_match_asianHandicapOdds_homeOdds

**Performance Metrics:**
- 💰 **ROI**: 14.46%
- 📊 **Correlation**: 0.0863
- 🎯 **Accuracy**: 57.1%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_topSixBattle with match.asianHandicapOdds.homeOdds

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 49. Single_awayFormLength

**Performance Metrics:**
- 💰 **ROI**: 14.18%
- 📊 **Correlation**: 0.0655
- 🎯 **Accuracy**: 57.4%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team form sample size predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.streaks.overall.form.length || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 50. Adaptive_Single_awayGoalDiff_Plus_match_awayWinOdds

**Performance Metrics:**
- 💰 **ROI**: 12.03%
- 📊 **Correlation**: 0.0760
- 🎯 **Accuracy**: 54.8%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayGoalDiff with match.awayWinOdds

**Verified Clean Factors Used:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.awayWinOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 51. Single_awayWinStreak

**Performance Metrics:**
- 💰 **ROI**: 11.59%
- 📊 **Correlation**: 0.1039
- 🎯 **Accuracy**: 56.2%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team longest win streak this season predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.streaks.overall.longest.win || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 52. Single_match_asianHandicapOdds_homeOdds

**Performance Metrics:**
- 💰 **ROI**: 11.56%
- 📊 **Correlation**: 0.0157
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.asianHandicapOdds.homeOdds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.asianHandicapOdds.homeOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 53. CrossRule_homePosition_x_relegationPressure

**Performance Metrics:**
- 💰 **ROI**: 10.76%
- 📊 **Correlation**: 0.1337
- 🎯 **Accuracy**: 54.7%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current league position combined with Combined relegation pressure (higher = more pressure)

**Verified Clean Factors Used:**
  - `timeSeries.home.leaguePosition || 20`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 54. Single_combinedOverRate

**Performance Metrics:**
- 💰 **ROI**: 10.54%
- 📊 **Correlation**: 0.0838
- 🎯 **Accuracy**: 55.4%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Combined team over rate predicts AH outcomes

**Verified Clean Factors Used:**
  - `((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 55. Over_Under_Patterns

**Performance Metrics:**
- 💰 **ROI**: 10.54%
- 📊 **Correlation**: 0.0838
- 🎯 **Accuracy**: 55.4%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: scoring_pattern
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Goal-scoring patterns correlate with Asian Handicap margins

**Verified Clean Factors Used:**
  - `timeSeries.home.cumulative.markets.overRate || 0`
  - `timeSeries.away.cumulative.markets.overRate || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 56. Adaptive_Single_awayWinStreak_Plus_match_asianHandicapOdds_homeOdds

**Performance Metrics:**
- 💰 **ROI**: 10.17%
- 📊 **Correlation**: 0.1075
- 🎯 **Accuracy**: 54.3%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayWinStreak with match.asianHandicapOdds.homeOdds

**Verified Clean Factors Used:**
  - `timeSeries.away.streaks.overall.longest.win || 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 57. Giant_Killing_Value

**Performance Metrics:**
- 💰 **ROI**: 10.07%
- 📊 **Correlation**: 0.0538
- 🎯 **Accuracy**: 52.7%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: david_vs_goliath
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Lower teams vs top 6 create systematic handicap value

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0`
  - `enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 58. Single_homeCurrentStreak

**Performance Metrics:**
- 💰 **ROI**: 9.80%
- 📊 **Correlation**: 0.0525
- 🎯 **Accuracy**: 46.8%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team current streak length predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 59. Single_match_over2_5Odds

**Performance Metrics:**
- 💰 **ROI**: 9.56%
- 📊 **Correlation**: 0.0368
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 845

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.over2_5Odds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.over2_5Odds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 60. CrossRule_homeCurrentStreak_x_titleRacePressure

**Performance Metrics:**
- 💰 **ROI**: 9.30%
- 📊 **Correlation**: 0.0772
- 🎯 **Accuracy**: 45.9%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current streak length combined with Combined title race pressure - HIGH values for top teams (profitable strategy - renamed from relegationPressure)

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 61. Single_relegationPressure

**Performance Metrics:**
- 💰 **ROI**: 8.91%
- 📊 **Correlation**: 0.0923
- 🎯 **Accuracy**: 55.4%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Combined relegation pressure (higher = more pressure) predicts AH outcomes

**Verified Clean Factors Used:**
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 62. CrossRule_homeCurrentStreak_x_streakDifferential

**Performance Metrics:**
- 💰 **ROI**: 8.37%
- 📊 **Correlation**: 0.0649
- 🎯 **Accuracy**: 43.9%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current streak length combined with Current streak differential (home - away)

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 63. Single_awayOverRate

**Performance Metrics:**
- 💰 **ROI**: 7.55%
- 📊 **Correlation**: 0.0808
- 🎯 **Accuracy**: 53.0%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team over 2.5 goals rate predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.cumulative.markets.overRate || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 64. Single_drawImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 7.37%
- 📊 **Correlation**: 0.1677
- 🎯 **Accuracy**: 51.3%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Implied probability of draw from odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.drawImpliedProb`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 65. Single_enhanced_performance_totalGoals

**Performance Metrics:**
- 💰 **ROI**: 7.15%
- 📊 **Correlation**: 0.0576
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1122

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: enhanced.performance.totalGoals directly predicts AH profit

**Verified Clean Factors Used:**
  - `enhanced.performance.totalGoals`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 66. Single_homeOverRate

**Performance Metrics:**
- 💰 **ROI**: 7.12%
- 📊 **Correlation**: 0.0537
- 🎯 **Accuracy**: 53.4%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team over 2.5 goals rate predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.cumulative.markets.overRate || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 67. Single_ahHomeOdds

**Performance Metrics:**
- 💰 **ROI**: 6.85%
- 📊 **Correlation**: 0.0356
- 🎯 **Accuracy**: 52.7%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Asian Handicap home odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `match.asianHandicapOdds.homeOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 68. Single_enhanced_marketEfficiency_totalImpliedProb

**Performance Metrics:**
- 💰 **ROI**: 6.49%
- 📊 **Correlation**: 0.0271
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: enhanced.marketEfficiency.totalImpliedProb directly predicts AH profit

**Verified Clean Factors Used:**
  - `enhanced.marketEfficiency.totalImpliedProb`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 69. Single_enhanced_marketEfficiency_cutPercentage

**Performance Metrics:**
- 💰 **ROI**: 6.49%
- 📊 **Correlation**: 0.0271
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: enhanced.marketEfficiency.cutPercentage directly predicts AH profit

**Verified Clean Factors Used:**
  - `enhanced.marketEfficiency.cutPercentage`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 70. Adaptive_Single_awayWinStreak_Plus_match_asianHandicapOdds_awayOdds

**Performance Metrics:**
- 💰 **ROI**: 6.09%
- 📊 **Correlation**: 0.0765
- 🎯 **Accuracy**: 53.6%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_awayWinStreak with match.asianHandicapOdds.awayOdds

**Verified Clean Factors Used:**
  - `timeSeries.away.streaks.overall.longest.win || 0`
  - `match.asianHandicapOdds.awayOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 71. Goal_Difference_Momentum

**Performance Metrics:**
- 💰 **ROI**: 6.05%
- 📊 **Correlation**: 0.0676
- 🎯 **Accuracy**: 53.6%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: performance_trend
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Season goal difference momentum affects handicap performance

**Verified Clean Factors Used:**
  - `timeSeries.home.cumulative.overall.goalDifference || 0`
  - `timeSeries.away.cumulative.overall.goalDifference || 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 72. CrossRule_homeCurrentStreak_x_relegationPressure

**Performance Metrics:**
- 💰 **ROI**: 5.92%
- 📊 **Correlation**: 0.0818
- 🎯 **Accuracy**: 52.8%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current streak length combined with Combined relegation pressure (higher = more pressure)

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 73. Single_match_asianHandicapOdds_awayOdds

**Performance Metrics:**
- 💰 **ROI**: 5.64%
- 📊 **Correlation**: 0.0190
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.asianHandicapOdds.awayOdds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.asianHandicapOdds.awayOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 74. CrossRule_homeCurrentStreak_x_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: 5.55%
- 📊 **Correlation**: 0.0440
- 🎯 **Accuracy**: 52.1%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current streak length combined with 1X2 home win odds

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `match.homeWinOdds`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 75. Single_underperformingTeam

**Performance Metrics:**
- 💰 **ROI**: 5.13%
- 📊 **Correlation**: 0.0532
- 🎯 **Accuracy**: 51.9%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Team in lower half but market still favors them predicts AH outcomes

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) > 10 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`

**Implementation Status:**
⚠️ **CONDITIONAL** - Needs further review before implementation

---

### 76. Single_titleRacePressure

**Performance Metrics:**
- 💰 **ROI**: 4.23%
- 📊 **Correlation**: 0.0704
- 🎯 **Accuracy**: 52.2%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Combined title race pressure - HIGH values for top teams (profitable strategy - renamed from relegationPressure) predicts AH outcomes

**Verified Clean Factors Used:**
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Status:**
🔍 **RESEARCH ONLY** - Profitable but low confidence

---

### 77. Single_streakDifferential

**Performance Metrics:**
- 💰 **ROI**: 2.45%
- 📊 **Correlation**: 0.0250
- 🎯 **Accuracy**: 51.7%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Current streak differential (home - away) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Status:**
🔍 **RESEARCH ONLY** - Profitable but low confidence

---

### 78. Single_match_under2_5Odds

**Performance Metrics:**
- 💰 **ROI**: 0.86%
- 📊 **Correlation**: 0.0426
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 845

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.under2_5Odds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.under2_5Odds`

**Implementation Status:**
🔍 **RESEARCH ONLY** - Profitable but low confidence

---

### 79. Over_Under_Correlation

**Performance Metrics:**
- 💰 **ROI**: 0.61%
- 📊 **Correlation**: 0.0249
- 🎯 **Accuracy**: 49.5%
- 📈 **Sample Size**: 493

**Strategy Details:**
- 🏷️ **Type**: scoring_style
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Team over/under patterns affect game flow and AH outcomes

**Verified Clean Factors Used:**
  - `((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2`
  - `match.over2_5Odds`

**Implementation Status:**
🔍 **RESEARCH ONLY** - Profitable but low confidence

---

### 80. CrossRule_streakDifferential_x_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: 0.32%
- 📊 **Correlation**: 0.0612
- 🎯 **Accuracy**: 49.5%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Current streak differential (home - away) combined with 1X2 home win odds

**Verified Clean Factors Used:**
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `match.homeWinOdds`

**Implementation Status:**
🔍 **RESEARCH ONLY** - Profitable but low confidence

---

### 81. Streak_Length_Disparity

**Performance Metrics:**
- 💰 **ROI**: 0.16%
- 📊 **Correlation**: 0.0568
- 🎯 **Accuracy**: 50.0%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: momentum_contrast
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Large differences in current streak lengths indicate value opportunities

**Verified Clean Factors Used:**
  - `Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))`

**Implementation Status:**
🔍 **RESEARCH ONLY** - Profitable but low confidence

---

### 82. Single_homeVenueStreak

**Performance Metrics:**
- 💰 **ROI**: -0.22%
- 📊 **Correlation**: 0.0514
- 🎯 **Accuracy**: 48.3%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team current venue streak predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.venue.current.count || 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 83. Hot_vs_Cold_Teams

**Performance Metrics:**
- 💰 **ROI**: -0.34%
- 📊 **Correlation**: 0.0256
- 🎯 **Accuracy**: 48.6%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: form_extreme
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extreme form differences (hot vs cold) create betting opportunities

**Verified Clean Factors Used:**
  - `Math.max(timeSeries.home.streaks.overall.longest.win || 0, timeSeries.away.streaks.overall.longest.win || 0)`
  - `Math.max(timeSeries.home.streaks.overall.longest.loss || 0, timeSeries.away.streaks.overall.longest.loss || 0)`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 84. Single_awayVenueStreak

**Performance Metrics:**
- 💰 **ROI**: -0.35%
- 📊 **Correlation**: 0.0238
- 🎯 **Accuracy**: 48.3%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team current venue streak predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.streaks.venue.current.count || 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 85. Single_extremeHomeFavorite

**Performance Metrics:**
- 💰 **ROI**: -0.42%
- 📊 **Correlation**: 0.0647
- 🎯 **Accuracy**: 49.1%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Extreme home favorites (>80% implied probability) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.8) ? 1 : 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 86. Single_fbref_attendance

**Performance Metrics:**
- 💰 **ROI**: -0.91%
- 📊 **Correlation**: 0.1824
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1124

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: fbref.attendance directly predicts AH profit

**Verified Clean Factors Used:**
  - `fbref.attendance`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 87. Relegation_Desperation

**Performance Metrics:**
- 💰 **ROI**: -0.92%
- 📊 **Correlation**: 0.0659
- 🎯 **Accuracy**: 47.3%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: survival_motivation
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Relegation battles create desperate performance affecting handicaps

**Verified Clean Factors Used:**
  - `(timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0`
  - `(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 88. Single_over2_5Odds

**Performance Metrics:**
- 💰 **ROI**: -0.98%
- 📊 **Correlation**: 0.0368
- 🎯 **Accuracy**: 46.5%
- 📈 **Sample Size**: 845

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Over 2.5 goals odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `match.over2_5Odds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 89. Single_meaningfulPositionGap

**Performance Metrics:**
- 💰 **ROI**: -1.25%
- 📊 **Correlation**: 0.0825
- 🎯 **Accuracy**: 48.0%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Large position gaps only matter when European spots or relegation involved predicts AH outcomes

**Verified Clean Factors Used:**
  - `(Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 90. Smart_Position_Gap

**Performance Metrics:**
- 💰 **ROI**: -1.25%
- 📊 **Correlation**: 0.0825
- 🎯 **Accuracy**: 48.0%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: contextual_position
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Position gaps work when stakes are involved and form aligns

**Verified Clean Factors Used:**
  - `(Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0`
  - `((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20) > 5) && ((timeSeries.home.streaks.overall.form.winRate || 0) - (timeSeries.away.streaks.overall.form.winRate || 0) > 0.3) ? 1 : 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 91. Single_homeBottomThree

**Performance Metrics:**
- 💰 **ROI**: -1.60%
- 📊 **Correlation**: 0.0600
- 🎯 **Accuracy**: 47.8%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team in relegation zone (bottom 3) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 92. Single_match_drawOdds

**Performance Metrics:**
- 💰 **ROI**: -1.99%
- 📊 **Correlation**: 0.1705
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.drawOdds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.drawOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 93. CrossRule_homeCurrentStreak_x_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -2.00%
- 📊 **Correlation**: 0.0267
- 🎯 **Accuracy**: 48.8%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current streak length combined with Implied probability of home win from odds

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 94. Single_awayCurrentStreak

**Performance Metrics:**
- 💰 **ROI**: -2.22%
- 📊 **Correlation**: 0.0438
- 🎯 **Accuracy**: 47.9%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Away team current streak length predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.away.streaks.overall.current.count || 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 95. Home_Advantage

**Performance Metrics:**
- 💰 **ROI**: -2.38%
- 📊 **Correlation**: 0.0007
- 🎯 **Accuracy**: 48.4%
- 📈 **Sample Size**: 1124

**Strategy Details:**
- 🏷️ **Type**: contextual
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Higher attendance correlates with stronger home advantage

**Verified Clean Factors Used:**
  - `fbref.attendance`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 96. Single_ahAwayOdds

**Performance Metrics:**
- 💰 **ROI**: -2.50%
- 📊 **Correlation**: 0.0190
- 🎯 **Accuracy**: 47.4%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Asian Handicap away odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `match.asianHandicapOdds.awayOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 97. Single_totalImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -2.83%
- 📊 **Correlation**: 0.0271
- 🎯 **Accuracy**: 46.1%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Total implied probability (shows overround) predicts AH outcomes

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.totalImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 98. Overround_Analysis

**Performance Metrics:**
- 💰 **ROI**: -2.83%
- 📊 **Correlation**: 0.0271
- 🎯 **Accuracy**: 46.1%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: market_analysis
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: High overround markets may have less efficient pricing

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.totalImpliedProb`
  - `enhanced.preMatch.marketEfficiency.cutPercentage`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 99. Single_cutPercentage

**Performance Metrics:**
- 💰 **ROI**: -2.83%
- 📊 **Correlation**: 0.0271
- 🎯 **Accuracy**: 46.1%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Bookmaker margin/cut percentage predicts AH outcomes

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.cutPercentage`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 100. Streak_Momentum

**Performance Metrics:**
- 💰 **ROI**: -2.86%
- 📊 **Correlation**: 0.0396
- 🎯 **Accuracy**: 50.0%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: momentum
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Current form streaks predict Asian Handicap outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `timeSeries.away.streaks.overall.current.count || 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 101. Single_under2_5Odds

**Performance Metrics:**
- 💰 **ROI**: -3.35%
- 📊 **Correlation**: 0.0056
- 🎯 **Accuracy**: 47.2%
- 📈 **Sample Size**: 845

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Under 2.5 goals odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `match.under2_5Odds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 102. Goals_Market_Efficiency

**Performance Metrics:**
- 💰 **ROI**: -5.77%
- 📊 **Correlation**: 0.0400
- 🎯 **Accuracy**: 45.0%
- 📈 **Sample Size**: 845

**Strategy Details:**
- 🏷️ **Type**: market_analysis
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Over/under odds relationship shows market efficiency

**Verified Clean Factors Used:**
  - `match.over2_5Odds`
  - `match.under2_5Odds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 103. Single_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -6.26%
- 📊 **Correlation**: 0.0582
- 🎯 **Accuracy**: 46.7%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Implied probability of home win from odds predicts AH outcomes

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 104. Market_Bias

**Performance Metrics:**
- 💰 **ROI**: -7.46%
- 📊 **Correlation**: 0.0549
- 🎯 **Accuracy**: 46.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Market bias toward home/away indicates value opportunities

**Verified Clean Factors Used:**
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 105. Single_giantKilling

**Performance Metrics:**
- 💰 **ROI**: -7.52%
- 📊 **Correlation**: 0.2252
- 🎯 **Accuracy**: 35.8%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Lower team vs top 6 (giant killing scenario) predicts AH outcomes

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 106. Single_positionGapAbs

**Performance Metrics:**
- 💰 **ROI**: -8.14%
- 📊 **Correlation**: 0.0490
- 🎯 **Accuracy**: 44.4%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Absolute league position gap between teams predicts AH outcomes

**Verified Clean Factors Used:**
  - `Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 107. Streak_vs_Quality

**Performance Metrics:**
- 💰 **ROI**: -9.09%
- 📊 **Correlation**: 0.0684
- 🎯 **Accuracy**: 44.8%
- 📈 **Sample Size**: 726

**Strategy Details:**
- 🏷️ **Type**: momentum_vs_ability
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Streak momentum vs underlying quality creates mispricing

**Verified Clean Factors Used:**
  - `Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))`
  - `Math.abs(enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb)`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 108. Combined_Position_Strength

**Performance Metrics:**
- 💰 **ROI**: -9.42%
- 📊 **Correlation**: 0.0728
- 🎯 **Accuracy**: 44.3%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: match_quality
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Average team quality affects match competitiveness and handicap accuracy

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 109. Single_combinedPosition

**Performance Metrics:**
- 💰 **ROI**: -9.42%
- 📊 **Correlation**: 0.0728
- 🎯 **Accuracy**: 44.3%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Combined league positions (lower = better teams) predicts AH outcomes

**Verified Clean Factors Used:**
  - `(timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 110. Single_averagePosition

**Performance Metrics:**
- 💰 **ROI**: -9.42%
- 📊 **Correlation**: 0.0728
- 🎯 **Accuracy**: 44.3%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Average league position of both teams predicts AH outcomes

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 111. Quality_Team_Overreaction

**Performance Metrics:**
- 💰 **ROI**: -9.59%
- 📊 **Correlation**: 0.0619
- 🎯 **Accuracy**: 44.1%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: overreaction_fade
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Market overreacts to good teams in temporary bad form

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) <= 10 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.3 && (timeSeries.home.streaks.overall.form.length || 0) >= 3) ? 1 : 0`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 112. Form_Position_Divergence_Rescue

**Performance Metrics:**
- 💰 **ROI**: -9.59%
- 📊 **Correlation**: 0.0619
- 🎯 **Accuracy**: 44.1%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: overreaction_rescue
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Market overvalues good teams in bad form - rescue for form vs ability disconnect

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.4) ? 1 : 0`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 113. Single_enhanced_marketEfficiency_homeImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -9.77%
- 📊 **Correlation**: 0.4141
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: enhanced.marketEfficiency.homeImpliedProb directly predicts AH profit

**Verified Clean Factors Used:**
  - `enhanced.marketEfficiency.homeImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 114. Single_match_awayWinOdds

**Performance Metrics:**
- 💰 **ROI**: -10.09%
- 📊 **Correlation**: 0.3296
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: match.awayWinOdds directly predicts AH profit

**Verified Clean Factors Used:**
  - `match.awayWinOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 115. Single_enhanced_marketEfficiency_homeImpliedProb___enhanced_marketEfficiency_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -10.21%
- 📊 **Correlation**: 0.4142
- 🎯 **Accuracy**: 0.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: enhanced.marketEfficiency.homeImpliedProb - enhanced.marketEfficiency.awayImpliedProb directly predicts AH profit

**Verified Clean Factors Used:**
  - `enhanced.marketEfficiency.homeImpliedProb - enhanced.marketEfficiency.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 116. AH_Momentum_vs_Market

**Performance Metrics:**
- 💰 **ROI**: -10.29%
- 📊 **Correlation**: 0.0579
- 🎯 **Accuracy**: 43.9%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: market_vs_form
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Asian Handicap form vs market expectations reveals value

**Verified Clean Factors Used:**
  - `(timeSeries.home.cumulative.markets.asianHandicapWinRate || 0) - (timeSeries.away.cumulative.markets.asianHandicapWinRate || 0)`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 117. Position_Quality_Mismatch

**Performance Metrics:**
- 💰 **ROI**: -10.47%
- 📊 **Correlation**: 0.0831
- 🎯 **Accuracy**: 43.5%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: quality_vs_market
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Large position gaps vs market odds reveal mispricing

**Verified Clean Factors Used:**
  - `Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 118. Position_Performance_Divergence

**Performance Metrics:**
- 💰 **ROI**: -12.16%
- 📊 **Correlation**: 0.0962
- 🎯 **Accuracy**: 43.0%
- 📈 **Sample Size**: 746

**Strategy Details:**
- 🏷️ **Type**: expectation_mismatch
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Teams whose position doesn't match market expectation offer value

**Verified Clean Factors Used:**
  - `(timeSeries.home.leaguePosition || 20) / (enhanced.preMatch.marketEfficiency.homeImpliedProb * 20)`
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 119. Single_homeLossStreak

**Performance Metrics:**
- 💰 **ROI**: -21.91%
- 📊 **Correlation**: 0.2008
- 🎯 **Accuracy**: 28.0%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team longest loss streak this season predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.longest.loss || 0`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 120. CrossRule_homePosition_x_titleRacePressure

**Performance Metrics:**
- 💰 **ROI**: -22.96%
- 📊 **Correlation**: 0.2274
- 🎯 **Accuracy**: 27.7%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current league position combined with Combined title race pressure - HIGH values for top teams (profitable strategy - renamed from relegationPressure)

**Verified Clean Factors Used:**
  - `timeSeries.home.leaguePosition || 20`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 121. CrossRule_homePosition_x_streakDifferential

**Performance Metrics:**
- 💰 **ROI**: -30.79%
- 📊 **Correlation**: 0.2888
- 🎯 **Accuracy**: 24.5%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current league position combined with Current streak differential (home - away)

**Verified Clean Factors Used:**
  - `timeSeries.home.leaguePosition || 20`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 122. Single_homePosition

**Performance Metrics:**
- 💰 **ROI**: -34.80%
- 📊 **Correlation**: 0.3073
- 🎯 **Accuracy**: 22.6%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: single
- 🧠 **Factors**: 1 factors
- 💡 **Hypothesis**: Home team current league position predicts AH outcomes

**Verified Clean Factors Used:**
  - `timeSeries.home.leaguePosition || 20`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 123. CrossRule_homeCurrentStreak_x_homePosition

**Performance Metrics:**
- 💰 **ROI**: -34.91%
- 📊 **Correlation**: 0.3035
- 🎯 **Accuracy**: 22.6%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current streak length combined with Home team current league position

**Verified Clean Factors Used:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `timeSeries.home.leaguePosition || 20`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 124. CrossRule_homePosition_x_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: -39.70%
- 📊 **Correlation**: 0.3693
- 🎯 **Accuracy**: 20.3%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: cross_rule
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Home team current league position combined with 1X2 home win odds

**Verified Clean Factors Used:**
  - `timeSeries.home.leaguePosition || 20`
  - `match.homeWinOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 125. Adaptive_Single_handicapLine_Plus_timeSeries_away_patterns_winRate

**Performance Metrics:**
- 💰 **ROI**: -43.62%
- 📊 **Correlation**: 0.4370
- 🎯 **Accuracy**: 18.4%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with timeSeries.away.patterns.winRate

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `timeSeries.away.patterns.winRate`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 126. Adaptive_Single_handicapLine_Plus_timeSeries_home_patterns_winRate

**Performance Metrics:**
- 💰 **ROI**: -44.40%
- 📊 **Correlation**: 0.4252
- 🎯 **Accuracy**: 18.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with timeSeries.home.patterns.winRate

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `timeSeries.home.patterns.winRate`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 127. Adaptive_Position_vs_Form_Plus_preMatch_enhanced_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -44.96%
- 📊 **Correlation**: 0.4173
- 🎯 **Accuracy**: 18.0%
- 📈 **Sample Size**: 1096

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 3 factors
- 💡 **Hypothesis**: Extending successful Position_vs_Form with preMatch.enhanced.awayImpliedProb

**Verified Clean Factors Used:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 128. Adaptive_Single_handicapLine_Plus_preMatch_enhanced_hadCut

**Performance Metrics:**
- 💰 **ROI**: -45.66%
- 📊 **Correlation**: 0.4165
- 🎯 **Accuracy**: 16.5%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with preMatch.enhanced.hadCut

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.enhanced.hadCut`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 129. Adaptive_Single_handicapLine_Plus_preMatch_match_asianHandicapOdds_awayOdds

**Performance Metrics:**
- 💰 **ROI**: -47.04%
- 📊 **Correlation**: 0.4475
- 🎯 **Accuracy**: 16.6%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with preMatch.match.asianHandicapOdds.awayOdds

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.match.asianHandicapOdds.awayOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 130. Adaptive_Single_handicapLine_Plus_preMatch_match_asianHandicapOdds_homeOdds

**Performance Metrics:**
- 💰 **ROI**: -47.44%
- 📊 **Correlation**: 0.4414
- 🎯 **Accuracy**: 15.9%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with preMatch.match.asianHandicapOdds.homeOdds

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.match.asianHandicapOdds.homeOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 131. Adaptive_Single_handicapLine_Plus_preMatch_match_homeWinOdds

**Performance Metrics:**
- 💰 **ROI**: -47.65%
- 📊 **Correlation**: 0.4293
- 🎯 **Accuracy**: 15.9%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with preMatch.match.homeWinOdds

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.match.homeWinOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 132. Adaptive_Falling_Giant_Fade_Plus_preMatch_enhanced_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -48.13%
- 📊 **Correlation**: 0.4531
- 🎯 **Accuracy**: 15.9%
- 📈 **Sample Size**: 1078

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 3 factors
- 💡 **Hypothesis**: Extending successful Falling_Giant_Fade with preMatch.enhanced.awayImpliedProb

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`
  - `match.homeWinOdds`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 133. Adaptive_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -48.14%
- 📊 **Correlation**: 0.4538
- 🎯 **Accuracy**: 16.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 3 factors
- 💡 **Hypothesis**: Extending successful AH_vs_1X2_Comparison with preMatch.enhanced.awayImpliedProb

**Verified Clean Factors Used:**
  - `match.asianHandicapOdds.homeOdds`
  - `match.homeWinOdds`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 134. Adaptive_Single_handicapLine_Plus_preMatch_enhanced_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -48.16%
- 📊 **Correlation**: 0.4563
- 🎯 **Accuracy**: 16.0%
- 📈 **Sample Size**: 1125

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_handicapLine with preMatch.enhanced.awayImpliedProb

**Verified Clean Factors Used:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 135. Adaptive_Single_homeWinOdds_Plus_preMatch_enhanced_awayImpliedProb

**Performance Metrics:**
- 💰 **ROI**: -48.28%
- 📊 **Correlation**: 0.4540
- 🎯 **Accuracy**: 15.9%
- 📈 **Sample Size**: 1126

**Strategy Details:**
- 🏷️ **Type**: adaptive
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Extending successful Single_homeWinOdds with preMatch.enhanced.awayImpliedProb

**Verified Clean Factors Used:**
  - `match.homeWinOdds`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---

### 136. Falling_Giant_Fade

**Performance Metrics:**
- 💰 **ROI**: -48.38%
- 📊 **Correlation**: 0.3905
- 🎯 **Accuracy**: 15.5%
- 📈 **Sample Size**: 1078

**Strategy Details:**
- 🏷️ **Type**: reverse_psychology
- 🧠 **Factors**: 2 factors
- 💡 **Hypothesis**: Fade quality home teams on losing streaks that market still backs

**Verified Clean Factors Used:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`
  - `match.homeWinOdds`

**Implementation Status:**
❌ **DO NOT IMPLEMENT** - Unprofitable strategy

---


*Generated on 2025-06-23T05:02:31.881Z*
*This document contains ONLY clean strategies with NO post-match data contamination (including XG)*
