# UPDATED CLEAN MODERATE 5 TO 20 ROI

## 📊 Tier Summary
- **Updated Clean Strategy Count**: 42
- **Average ROI**: 11.67%

## 1. Single_awayLossStreak

**Performance:**
- 💰 ROI: 19.62%
- 📊 Correlation: 0.1573
- 🎯 Accuracy: 51.2%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.streaks.overall.longest.loss || 0
- 💡 Hypothesis: Away team longest loss streak this season predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.streaks.overall.longest.loss || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 2. Single_attendance

**Performance:**
- 💰 ROI: 19.07%
- 📊 Correlation: 0.2083
- 🎯 Accuracy: 50.6%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: fbref.attendance
- 💡 Hypothesis: Stadium attendance (home advantage indicator) predicts AH outcomes

**Clean Factor Breakdown:**
  - `fbref.attendance`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 3. Single_europeanPressure

**Performance:**
- 💰 ROI: 18.95%
- 📊 Correlation: 0.0537
- 🎯 Accuracy: 58.5%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: Math.max(0, 7 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 7 - (timeSeries.away.leaguePosition || 20))
- 💡 Hypothesis: Combined European qualification pressure predicts AH outcomes

**Clean Factor Breakdown:**
  - `Math.max(0, 7 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 7 - (timeSeries.away.leaguePosition || 20))`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 4. Single_awayTopSix

**Performance:**
- 💰 ROI: 18.75%
- 📊 Correlation: 0.1010
- 🎯 Accuracy: 58.9%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0
- 💡 Hypothesis: Away team in top 6 positions (European spots) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 5. Single_awayBottomThree

**Performance:**
- 💰 ROI: 18.56%
- 📊 Correlation: 0.1407
- 🎯 Accuracy: 49.3%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0
- 💡 Hypothesis: Away team in relegation zone (bottom 3) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 6. Adaptive_Single_awayGoalDiff_Plus_match_asianHandicapOdds_homeOdds

**Performance:**
- 💰 ROI: 18.47%
- 📊 Correlation: 0.1139
- 🎯 Accuracy: 59.0%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: timeSeries.away.cumulative.overall.goalDifference || 0, match.asianHandicapOdds.homeOdds
- 💡 Hypothesis: Extending successful Single_awayGoalDiff with match.asianHandicapOdds.homeOdds

**Clean Factor Breakdown:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 7. Adaptive_Single_awayGoalDiff_Plus_match_asianHandicapOdds_awayOdds

**Performance:**
- 💰 ROI: 18.42%
- 📊 Correlation: 0.1131
- 🎯 Accuracy: 59.0%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: timeSeries.away.cumulative.overall.goalDifference || 0, match.asianHandicapOdds.awayOdds
- 💡 Hypothesis: Extending successful Single_awayGoalDiff with match.asianHandicapOdds.awayOdds

**Clean Factor Breakdown:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.asianHandicapOdds.awayOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 8. Single_awayGoalDiff

**Performance:**
- 💰 ROI: 17.73%
- 📊 Correlation: 0.1135
- 🎯 Accuracy: 58.6%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.cumulative.overall.goalDifference || 0
- 💡 Hypothesis: Away team cumulative goal difference predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 9. Adaptive_Single_awayGoalDiff_Plus_match_homeWinOdds

**Performance:**
- 💰 ROI: 16.88%
- 📊 Correlation: 0.1110
- 🎯 Accuracy: 57.4%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: timeSeries.away.cumulative.overall.goalDifference || 0, match.homeWinOdds
- 💡 Hypothesis: Extending successful Single_awayGoalDiff with match.homeWinOdds

**Clean Factor Breakdown:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.homeWinOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 10. Adaptive_Single_awayGoalDiff_Plus_match_drawOdds

**Performance:**
- 💰 ROI: 16.73%
- 📊 Correlation: 0.1091
- 🎯 Accuracy: 58.1%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: timeSeries.away.cumulative.overall.goalDifference || 0, match.drawOdds
- 💡 Hypothesis: Extending successful Single_awayGoalDiff with match.drawOdds

**Clean Factor Breakdown:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.drawOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 11. Adaptive_Single_awayTopSix_Plus_match_asianHandicapOdds_homeOdds

**Performance:**
- 💰 ROI: 16.03%
- 📊 Correlation: 0.1279
- 🎯 Accuracy: 56.8%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0, match.asianHandicapOdds.homeOdds
- 💡 Hypothesis: Extending successful Single_awayTopSix with match.asianHandicapOdds.homeOdds

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 12. European_Pressure

**Performance:**
- 💰 ROI: 15.56%
- 📊 Correlation: 0.0639
- 🎯 Accuracy: 57.7%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: stakes_analysis
- 🧠 Verified Clean Factors: (timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0, (timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0
- 💡 Hypothesis: European spot battles create extra motivation affecting performance

**Clean Factor Breakdown:**
  - `(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0`
  - `(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 13. Single_topSixBattle

**Performance:**
- 💰 ROI: 15.21%
- 📊 Correlation: 0.0978
- 🎯 Accuracy: 47.3%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0
- 💡 Hypothesis: Both teams competing for European spots predicts AH outcomes

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 14. Single_homeFormLength

**Performance:**
- 💰 ROI: 15.04%
- 📊 Correlation: 0.0700
- 🎯 Accuracy: 58.1%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.form.length || 0
- 💡 Hypothesis: Home team form sample size predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.form.length || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 15. Adaptive_Single_topSixBattle_Plus_match_asianHandicapOdds_homeOdds

**Performance:**
- 💰 ROI: 14.46%
- 📊 Correlation: 0.0863
- 🎯 Accuracy: 57.1%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0, match.asianHandicapOdds.homeOdds
- 💡 Hypothesis: Extending successful Single_topSixBattle with match.asianHandicapOdds.homeOdds

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 16. Single_awayFormLength

**Performance:**
- 💰 ROI: 14.18%
- 📊 Correlation: 0.0655
- 🎯 Accuracy: 57.4%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.streaks.overall.form.length || 0
- 💡 Hypothesis: Away team form sample size predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.streaks.overall.form.length || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 17. Adaptive_Single_awayGoalDiff_Plus_match_awayWinOdds

**Performance:**
- 💰 ROI: 12.03%
- 📊 Correlation: 0.0760
- 🎯 Accuracy: 54.8%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: timeSeries.away.cumulative.overall.goalDifference || 0, match.awayWinOdds
- 💡 Hypothesis: Extending successful Single_awayGoalDiff with match.awayWinOdds

**Clean Factor Breakdown:**
  - `timeSeries.away.cumulative.overall.goalDifference || 0`
  - `match.awayWinOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 18. Single_awayWinStreak

**Performance:**
- 💰 ROI: 11.59%
- 📊 Correlation: 0.1039
- 🎯 Accuracy: 56.2%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.streaks.overall.longest.win || 0
- 💡 Hypothesis: Away team longest win streak this season predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.streaks.overall.longest.win || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 19. Single_match_asianHandicapOdds_homeOdds

**Performance:**
- 💰 ROI: 11.56%
- 📊 Correlation: 0.0157
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.asianHandicapOdds.homeOdds
- 💡 Hypothesis: match.asianHandicapOdds.homeOdds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.asianHandicapOdds.homeOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 20. CrossRule_homePosition_x_relegationPressure

**Performance:**
- 💰 ROI: 10.76%
- 📊 Correlation: 0.1337
- 🎯 Accuracy: 54.7%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.leaguePosition || 20, Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- 💡 Hypothesis: Home team current league position combined with Combined relegation pressure (higher = more pressure)

**Clean Factor Breakdown:**
  - `timeSeries.home.leaguePosition || 20`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 21. Single_combinedOverRate

**Performance:**
- 💰 ROI: 10.54%
- 📊 Correlation: 0.0838
- 🎯 Accuracy: 55.4%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: ((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2
- 💡 Hypothesis: Combined team over rate predicts AH outcomes

**Clean Factor Breakdown:**
  - `((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 22. Over_Under_Patterns

**Performance:**
- 💰 ROI: 10.54%
- 📊 Correlation: 0.0838
- 🎯 Accuracy: 55.4%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: scoring_pattern
- 🧠 Verified Clean Factors: timeSeries.home.cumulative.markets.overRate || 0, timeSeries.away.cumulative.markets.overRate || 0
- 💡 Hypothesis: Goal-scoring patterns correlate with Asian Handicap margins

**Clean Factor Breakdown:**
  - `timeSeries.home.cumulative.markets.overRate || 0`
  - `timeSeries.away.cumulative.markets.overRate || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 23. Adaptive_Single_awayWinStreak_Plus_match_asianHandicapOdds_homeOdds

**Performance:**
- 💰 ROI: 10.17%
- 📊 Correlation: 0.1075
- 🎯 Accuracy: 54.3%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: timeSeries.away.streaks.overall.longest.win || 0, match.asianHandicapOdds.homeOdds
- 💡 Hypothesis: Extending successful Single_awayWinStreak with match.asianHandicapOdds.homeOdds

**Clean Factor Breakdown:**
  - `timeSeries.away.streaks.overall.longest.win || 0`
  - `match.asianHandicapOdds.homeOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 24. Giant_Killing_Value

**Performance:**
- 💰 ROI: 10.07%
- 📊 Correlation: 0.0538
- 🎯 Accuracy: 52.7%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: david_vs_goliath
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0, enhanced.preMatch.marketEfficiency.awayImpliedProb
- 💡 Hypothesis: Lower teams vs top 6 create systematic handicap value

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0`
  - `enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 25. Single_homeCurrentStreak

**Performance:**
- 💰 ROI: 9.80%
- 📊 Correlation: 0.0525
- 🎯 Accuracy: 46.8%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0
- 💡 Hypothesis: Home team current streak length predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 26. Single_match_over2_5Odds

**Performance:**
- 💰 ROI: 9.56%
- 📊 Correlation: 0.0368
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 845

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.over2_5Odds
- 💡 Hypothesis: match.over2_5Odds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.over2_5Odds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 27. CrossRule_homeCurrentStreak_x_titleRacePressure

**Performance:**
- 💰 ROI: 9.30%
- 📊 Correlation: 0.0772
- 🎯 Accuracy: 45.9%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0, Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- 💡 Hypothesis: Home team current streak length combined with Combined title race pressure - HIGH values for top teams (profitable strategy - renamed from relegationPressure)

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 28. Single_relegationPressure

**Performance:**
- 💰 ROI: 8.91%
- 📊 Correlation: 0.0923
- 🎯 Accuracy: 55.4%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- 💡 Hypothesis: Combined relegation pressure (higher = more pressure) predicts AH outcomes

**Clean Factor Breakdown:**
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 29. CrossRule_homeCurrentStreak_x_streakDifferential

**Performance:**
- 💰 ROI: 8.37%
- 📊 Correlation: 0.0649
- 🎯 Accuracy: 43.9%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0, (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)
- 💡 Hypothesis: Home team current streak length combined with Current streak differential (home - away)

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 30. Single_awayOverRate

**Performance:**
- 💰 ROI: 7.55%
- 📊 Correlation: 0.0808
- 🎯 Accuracy: 53.0%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.cumulative.markets.overRate || 0
- 💡 Hypothesis: Away team over 2.5 goals rate predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.cumulative.markets.overRate || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 31. Single_drawImpliedProb

**Performance:**
- 💰 ROI: 7.37%
- 📊 Correlation: 0.1677
- 🎯 Accuracy: 51.3%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.drawImpliedProb
- 💡 Hypothesis: Implied probability of draw from odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.drawImpliedProb`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 32. Single_enhanced_performance_totalGoals

**Performance:**
- 💰 ROI: 7.15%
- 📊 Correlation: 0.0576
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1122

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.performance.totalGoals
- 💡 Hypothesis: enhanced.performance.totalGoals directly predicts AH profit

**Clean Factor Breakdown:**
  - `enhanced.performance.totalGoals`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 33. Single_homeOverRate

**Performance:**
- 💰 ROI: 7.12%
- 📊 Correlation: 0.0537
- 🎯 Accuracy: 53.4%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.cumulative.markets.overRate || 0
- 💡 Hypothesis: Home team over 2.5 goals rate predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.cumulative.markets.overRate || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 34. Single_ahHomeOdds

**Performance:**
- 💰 ROI: 6.85%
- 📊 Correlation: 0.0356
- 🎯 Accuracy: 52.7%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.asianHandicapOdds.homeOdds
- 💡 Hypothesis: Asian Handicap home odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `match.asianHandicapOdds.homeOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 35. Single_enhanced_marketEfficiency_totalImpliedProb

**Performance:**
- 💰 ROI: 6.49%
- 📊 Correlation: 0.0271
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.marketEfficiency.totalImpliedProb
- 💡 Hypothesis: enhanced.marketEfficiency.totalImpliedProb directly predicts AH profit

**Clean Factor Breakdown:**
  - `enhanced.marketEfficiency.totalImpliedProb`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 36. Single_enhanced_marketEfficiency_cutPercentage

**Performance:**
- 💰 ROI: 6.49%
- 📊 Correlation: 0.0271
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.marketEfficiency.cutPercentage
- 💡 Hypothesis: enhanced.marketEfficiency.cutPercentage directly predicts AH profit

**Clean Factor Breakdown:**
  - `enhanced.marketEfficiency.cutPercentage`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 37. Adaptive_Single_awayWinStreak_Plus_match_asianHandicapOdds_awayOdds

**Performance:**
- 💰 ROI: 6.09%
- 📊 Correlation: 0.0765
- 🎯 Accuracy: 53.6%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: timeSeries.away.streaks.overall.longest.win || 0, match.asianHandicapOdds.awayOdds
- 💡 Hypothesis: Extending successful Single_awayWinStreak with match.asianHandicapOdds.awayOdds

**Clean Factor Breakdown:**
  - `timeSeries.away.streaks.overall.longest.win || 0`
  - `match.asianHandicapOdds.awayOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 38. Goal_Difference_Momentum

**Performance:**
- 💰 ROI: 6.05%
- 📊 Correlation: 0.0676
- 🎯 Accuracy: 53.6%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: performance_trend
- 🧠 Verified Clean Factors: timeSeries.home.cumulative.overall.goalDifference || 0, timeSeries.away.cumulative.overall.goalDifference || 0
- 💡 Hypothesis: Season goal difference momentum affects handicap performance

**Clean Factor Breakdown:**
  - `timeSeries.home.cumulative.overall.goalDifference || 0`
  - `timeSeries.away.cumulative.overall.goalDifference || 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 39. CrossRule_homeCurrentStreak_x_relegationPressure

**Performance:**
- 💰 ROI: 5.92%
- 📊 Correlation: 0.0818
- 🎯 Accuracy: 52.8%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0, Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- 💡 Hypothesis: Home team current streak length combined with Combined relegation pressure (higher = more pressure)

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 40. Single_match_asianHandicapOdds_awayOdds

**Performance:**
- 💰 ROI: 5.64%
- 📊 Correlation: 0.0190
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.asianHandicapOdds.awayOdds
- 💡 Hypothesis: match.asianHandicapOdds.awayOdds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.asianHandicapOdds.awayOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 41. CrossRule_homeCurrentStreak_x_homeWinOdds

**Performance:**
- 💰 ROI: 5.55%
- 📊 Correlation: 0.0440
- 🎯 Accuracy: 52.1%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0, match.homeWinOdds
- 💡 Hypothesis: Home team current streak length combined with 1X2 home win odds

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `match.homeWinOdds`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
## 42. Single_underperformingTeam

**Performance:**
- 💰 ROI: 5.13%
- 📊 Correlation: 0.0532
- 🎯 Accuracy: 51.9%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) > 10 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0
- 💡 Hypothesis: Team in lower half but market still favors them predicts AH outcomes

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) > 10 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`

**Implementation Recommendation:**
⚠️ **CONDITIONAL IMPLEMENTATION** - Review risk management

---
