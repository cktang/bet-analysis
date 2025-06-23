# ALL 47 BETTING STRATEGIES - COMPLETE ANALYSIS

## 📊 SYSTEM OVERVIEW

- **Total Strategies Tested**: 47
- **Profitable Strategies**: 23
- **Success Rate**: 48.9%
- **Average ROI**: 0.03%
- **Data Source**: 100% Pre-match data only (Zero contamination)

## 🏆 PERFORMANCE CATEGORIES

### 🚀 Ready to Implement (>20% ROI): 0 strategies
### ⚠️ Conditional Use (5-20% ROI): 21 strategies  
### 🔍 Research Only (0-5% ROI): 2 strategies
### ❌ Unprofitable (<0% ROI): 24 strategies

---

# 📋 COMPLETE STRATEGY DETAILS

## 1. Single_awayGoalDiff

**📊 Performance Metrics:**
- **Overall ROI**: 17.73%
- **Correlation**: 0.1135
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.away.cumulative.overall.goalDifference || 0
- **Hypothesis**: Away team cumulative goal difference predicts AH outcomes

**💰 Financial Performance:**



---

## 2. European_Pressure

**📊 Performance Metrics:**
- **Overall ROI**: 15.56%
- **Correlation**: 0.0639
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: stakes_analysis
- **Factors**: (timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0, (timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0
- **Hypothesis**: European spot battles create extra motivation affecting performance

**💰 Financial Performance:**



---

## 3. Single_homeFormLength

**📊 Performance Metrics:**
- **Overall ROI**: 15.04%
- **Correlation**: 0.0700
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.home.streaks.overall.form.length || 0
- **Hypothesis**: Home team form sample size predicts AH outcomes

**💰 Financial Performance:**



---

## 4. Single_awayTopSix

**📊 Performance Metrics:**
- **Overall ROI**: 14.78%
- **Correlation**: 0.1188
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: (timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0
- **Hypothesis**: Away team in top 6 positions (European spots) predicts AH outcomes

**💰 Financial Performance:**



---

## 5. Single_awayFormLength

**📊 Performance Metrics:**
- **Overall ROI**: 14.18%
- **Correlation**: 0.0655
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.away.streaks.overall.form.length || 0
- **Hypothesis**: Away team form sample size predicts AH outcomes

**💰 Financial Performance:**



---

## 6. Single_topSixBattle

**📊 Performance Metrics:**
- **Overall ROI**: 12.12%
- **Correlation**: 0.1097
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: ((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0
- **Hypothesis**: Both teams competing for European spots predicts AH outcomes

**💰 Financial Performance:**



---

## 7. Single_awayWinStreak

**📊 Performance Metrics:**
- **Overall ROI**: 11.59%
- **Correlation**: 0.1039
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.away.streaks.overall.longest.win || 0
- **Hypothesis**: Away team longest win streak this season predicts AH outcomes

**💰 Financial Performance:**



---

## 8. Single_combinedOverRate

**📊 Performance Metrics:**
- **Overall ROI**: 10.54%
- **Correlation**: 0.0838
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: ((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2
- **Hypothesis**: Combined team over rate predicts AH outcomes

**💰 Financial Performance:**



---

## 9. Over_Under_Patterns

**📊 Performance Metrics:**
- **Overall ROI**: 10.54%
- **Correlation**: 0.0838
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: scoring_pattern
- **Factors**: timeSeries.home.cumulative.markets.overRate || 0, timeSeries.away.cumulative.markets.overRate || 0
- **Hypothesis**: Goal-scoring patterns correlate with Asian Handicap margins

**💰 Financial Performance:**



---

## 10. Single_handicapLine

**📊 Performance Metrics:**
- **Overall ROI**: 10.51%
- **Correlation**: 0.0541
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])
- **Hypothesis**: Asian Handicap line value predicts AH outcomes

**💰 Financial Performance:**



---

## 11. Giant_Killing_Value

**📊 Performance Metrics:**
- **Overall ROI**: 10.07%
- **Correlation**: 0.0538
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: david_vs_goliath
- **Factors**: ((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0, enhanced.preMatch.marketEfficiency.awayImpliedProb
- **Hypothesis**: Lower teams vs top 6 create systematic handicap value

**💰 Financial Performance:**



---

## 12. AH_vs_1X2_Comparison

**📊 Performance Metrics:**
- **Overall ROI**: 9.32%
- **Correlation**: 0.0508
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: cross_market
- **Factors**: match.asianHandicapOdds.homeOdds, match.homeWinOdds
- **Hypothesis**: Asian Handicap vs 1X2 odds comparison reveals value

**💰 Financial Performance:**



---

## 13. Single_relegationPressure

**📊 Performance Metrics:**
- **Overall ROI**: 8.91%
- **Correlation**: 0.0923
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- **Hypothesis**: Combined relegation pressure (higher = more pressure) predicts AH outcomes

**💰 Financial Performance:**



---

## 14. Single_homeWinOdds

**📊 Performance Metrics:**
- **Overall ROI**: 8.69%
- **Correlation**: 0.0491
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: match.homeWinOdds
- **Hypothesis**: 1X2 home win odds predicts AH outcomes

**💰 Financial Performance:**



---

## 15. Single_awayImpliedProb

**📊 Performance Metrics:**
- **Overall ROI**: 8.17%
- **Correlation**: 0.0505
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: enhanced.preMatch.marketEfficiency.awayImpliedProb
- **Hypothesis**: Implied probability of away win from odds predicts AH outcomes

**💰 Financial Performance:**



---

## 16. Single_awayOverRate

**📊 Performance Metrics:**
- **Overall ROI**: 7.55%
- **Correlation**: 0.0808
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.away.cumulative.markets.overRate || 0
- **Hypothesis**: Away team over 2.5 goals rate predicts AH outcomes

**💰 Financial Performance:**



---

## 17. Win_Odds_Ratio

**📊 Performance Metrics:**
- **Overall ROI**: 7.25%
- **Correlation**: 0.0477
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: match.homeWinOdds / match.awayWinOdds
- **Hypothesis**: Home vs away win odds ratio indicates market sentiment

**💰 Financial Performance:**



---

## 18. Single_homeOverRate

**📊 Performance Metrics:**
- **Overall ROI**: 7.12%
- **Correlation**: 0.0537
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.home.cumulative.markets.overRate || 0
- **Hypothesis**: Home team over 2.5 goals rate predicts AH outcomes

**💰 Financial Performance:**



---

## 19. Goal_Difference_Momentum

**📊 Performance Metrics:**
- **Overall ROI**: 6.05%
- **Correlation**: 0.0676
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: performance_trend
- **Factors**: timeSeries.home.cumulative.overall.goalDifference || 0, timeSeries.away.cumulative.overall.goalDifference || 0
- **Hypothesis**: Season goal difference momentum affects handicap performance

**💰 Financial Performance:**



---

## 20. CrossRule_homeCurrentStreak_x_relegationPressure

**📊 Performance Metrics:**
- **Overall ROI**: 5.92%
- **Correlation**: 0.0818
- **Win Rate**: NaN%
- **Sample Size**: 726
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: cross_rule
- **Factors**: timeSeries.home.streaks.overall.current.count || 0, Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- **Hypothesis**: Home team current streak length combined with Combined relegation pressure (higher = more pressure)

**💰 Financial Performance:**



---

## 21. Single_underperformingTeam

**📊 Performance Metrics:**
- **Overall ROI**: 5.13%
- **Correlation**: 0.0532
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ⚠️ CONDITIONAL USE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: ((timeSeries.home.leaguePosition || 20) > 10 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0
- **Hypothesis**: Team in lower half but market still favors them predicts AH outcomes

**💰 Financial Performance:**



---

## 22. Single_drawImpliedProb

**📊 Performance Metrics:**
- **Overall ROI**: 0.99%
- **Correlation**: 0.0488
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: 🔍 RESEARCH ONLY

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: enhanced.preMatch.marketEfficiency.drawImpliedProb
- **Hypothesis**: Implied probability of draw from odds predicts AH outcomes

**💰 Financial Performance:**



---

## 23. Streak_Length_Disparity

**📊 Performance Metrics:**
- **Overall ROI**: 0.16%
- **Correlation**: 0.0568
- **Win Rate**: NaN%
- **Sample Size**: 726
- **Status**: 🔍 RESEARCH ONLY

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: momentum_contrast
- **Factors**: Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))
- **Hypothesis**: Large differences in current streak lengths indicate value opportunities

**💰 Financial Performance:**



---

## 24. Single_homeVenueStreak

**📊 Performance Metrics:**
- **Overall ROI**: -0.22%
- **Correlation**: 0.0514
- **Win Rate**: NaN%
- **Sample Size**: 726
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 20% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.home.streaks.venue.current.count || 0
- **Hypothesis**: Home team current venue streak predicts AH outcomes

**💰 Financial Performance:**



---

## 25. Relegation_Desperation

**📊 Performance Metrics:**
- **Overall ROI**: -0.92%
- **Correlation**: 0.0659
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 20% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: survival_motivation
- **Factors**: (timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0, (timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0
- **Hypothesis**: Relegation battles create desperate performance affecting handicaps

**💰 Financial Performance:**



---

## 26. Single_homeBottomThree

**📊 Performance Metrics:**
- **Overall ROI**: -1.60%
- **Correlation**: 0.0600
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: (timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0
- **Hypothesis**: Home team in relegation zone (bottom 3) predicts AH outcomes

**💰 Financial Performance:**



---

## 27. Mid_Table_Mediocrity

**📊 Performance Metrics:**
- **Overall ROI**: -3.54%
- **Correlation**: 0.0727
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 10% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: motivation_vacuum
- **Factors**: ((timeSeries.home.leaguePosition || 20) > 8 && (timeSeries.home.leaguePosition || 20) < 16 && (timeSeries.away.leaguePosition || 20) > 8 && (timeSeries.away.leaguePosition || 20) < 16) ? 1 : 0, match.drawOdds
- **Hypothesis**: Safe mid-table teams produce more unpredictable results

**💰 Financial Performance:**



---

## 28. Single_drawOdds

**📊 Performance Metrics:**
- **Overall ROI**: -5.55%
- **Correlation**: 0.0587
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: match.drawOdds
- **Hypothesis**: 1X2 draw odds predicts AH outcomes

**💰 Financial Performance:**



---

## 29. Single_positionGapAbs

**📊 Performance Metrics:**
- **Overall ROI**: -8.83%
- **Correlation**: 0.0774
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))
- **Hypothesis**: Absolute league position gap between teams predicts AH outcomes

**💰 Financial Performance:**



---

## 30. Single_awayWinOdds

**📊 Performance Metrics:**
- **Overall ROI**: -8.91%
- **Correlation**: 0.0742
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: match.awayWinOdds
- **Hypothesis**: 1X2 away win odds predicts AH outcomes

**💰 Financial Performance:**



---

## 31. Market_Bias

**📊 Performance Metrics:**
- **Overall ROI**: -9.04%
- **Correlation**: 0.0549
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb
- **Hypothesis**: Market bias toward home/away indicates value opportunities

**💰 Financial Performance:**



---

## 32. Streak_vs_Quality

**📊 Performance Metrics:**
- **Overall ROI**: -9.09%
- **Correlation**: 0.0684
- **Win Rate**: NaN%
- **Sample Size**: 726
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 20% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: momentum_vs_ability
- **Factors**: Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)), Math.abs(enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb)
- **Hypothesis**: Streak momentum vs underlying quality creates mispricing

**💰 Financial Performance:**



---

## 33. Single_awayLossStreak

**📊 Performance Metrics:**
- **Overall ROI**: -9.11%
- **Correlation**: 0.0770
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.away.streaks.overall.longest.loss || 0
- **Hypothesis**: Away team longest loss streak this season predicts AH outcomes

**💰 Financial Performance:**



---

## 34. Single_homeImpliedProb

**📊 Performance Metrics:**
- **Overall ROI**: -9.49%
- **Correlation**: 0.0582
- **Win Rate**: NaN%
- **Sample Size**: 1125
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: enhanced.preMatch.marketEfficiency.homeImpliedProb
- **Hypothesis**: Implied probability of home win from odds predicts AH outcomes

**💰 Financial Performance:**



---

## 35. AH_Momentum_vs_Market

**📊 Performance Metrics:**
- **Overall ROI**: -10.29%
- **Correlation**: 0.0579
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: market_vs_form
- **Factors**: (timeSeries.home.cumulative.markets.asianHandicapWinRate || 0) - (timeSeries.away.cumulative.markets.asianHandicapWinRate || 0), enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb
- **Hypothesis**: Asian Handicap form vs market expectations reveals value

**💰 Financial Performance:**



---

## 36. Position_Quality_Mismatch

**📊 Performance Metrics:**
- **Overall ROI**: -10.47%
- **Correlation**: 0.0831
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: quality_vs_market
- **Factors**: Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)), enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb
- **Hypothesis**: Large position gaps vs market odds reveal mispricing

**💰 Financial Performance:**



---

## 37. Position_vs_Form

**📊 Performance Metrics:**
- **Overall ROI**: -10.67%
- **Correlation**: 0.0946
- **Win Rate**: NaN%
- **Sample Size**: 726
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: position_form_divergence
- **Factors**: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20), (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)
- **Hypothesis**: Position vs current form creates value when they diverge

**💰 Financial Performance:**



---

## 38. Position_Gap_Analysis

**📊 Performance Metrics:**
- **Overall ROI**: -11.45%
- **Correlation**: 0.0991
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: position_differential
- **Factors**: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)
- **Hypothesis**: Large position gaps create predictable handicap value

**💰 Financial Performance:**



---

## 39. Single_positionGap

**📊 Performance Metrics:**
- **Overall ROI**: -11.45%
- **Correlation**: 0.0991
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 30% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)
- **Hypothesis**: League position gap (away - home, positive = home higher) predicts AH outcomes

**💰 Financial Performance:**



---

## 40. Momentum_Clash

**📊 Performance Metrics:**
- **Overall ROI**: -11.47%
- **Correlation**: 0.0924
- **Win Rate**: NaN%
- **Sample Size**: 726
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: momentum_differential
- **Factors**: (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0), (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- **Hypothesis**: Teams with opposing momentum create predictable Asian Handicap value

**💰 Financial Performance:**



---

## 41. Combined_Position_Strength

**📊 Performance Metrics:**
- **Overall ROI**: -11.54%
- **Correlation**: 0.0941
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: match_quality
- **Factors**: ((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2
- **Hypothesis**: Average team quality affects match competitiveness and handicap accuracy

**💰 Financial Performance:**



---

## 42. Single_combinedPosition

**📊 Performance Metrics:**
- **Overall ROI**: -11.54%
- **Correlation**: 0.0941
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: (timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)
- **Hypothesis**: Combined league positions (lower = better teams) predicts AH outcomes

**💰 Financial Performance:**



---

## 43. Single_averagePosition

**📊 Performance Metrics:**
- **Overall ROI**: -11.54%
- **Correlation**: 0.0941
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: ((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2
- **Hypothesis**: Average league position of both teams predicts AH outcomes

**💰 Financial Performance:**



---

## 44. Position_vs_Goal_Difference

**📊 Performance Metrics:**
- **Overall ROI**: -12.08%
- **Correlation**: 0.0976
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: performance_vs_position
- **Factors**: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20), (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- **Hypothesis**: League position vs goal difference reveals over/underperforming teams

**💰 Financial Performance:**



---

## 45. Position_Performance_Divergence

**📊 Performance Metrics:**
- **Overall ROI**: -12.16%
- **Correlation**: 0.0962
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: expectation_mismatch
- **Factors**: (timeSeries.home.leaguePosition || 20) / (enhanced.preMatch.marketEfficiency.homeImpliedProb * 20), (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- **Hypothesis**: Teams whose position doesn't match market expectation offer value

**💰 Financial Performance:**



---

## 46. Single_goalDiffMomentum

**📊 Performance Metrics:**
- **Overall ROI**: -12.66%
- **Correlation**: 0.0928
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 25% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- **Hypothesis**: Goal difference momentum comparison predicts AH outcomes

**💰 Financial Performance:**



---

## 47. Single_awayPosition

**📊 Performance Metrics:**
- **Overall ROI**: -13.00%
- **Correlation**: 0.1364
- **Win Rate**: NaN%
- **Sample Size**: 746
- **Status**: ❌ UNPROFITABLE

**🎯 Betting Details:**
- **Home Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Away Bets**: 0 (Win Rate: 0%, ROI: 0.00%)
- **Threshold**: 15% (top/bottom)

**🔍 Strategy Logic:**
- **Type**: single
- **Factors**: timeSeries.away.leaguePosition || 20
- **Hypothesis**: Away team current league position predicts AH outcomes

**💰 Financial Performance:**



---

---

## 📈 SUMMARY STATISTICS

**Top 10 Performers:**
1. Single_awayGoalDiff: 17.73% ROI
2. European_Pressure: 15.56% ROI
3. Single_homeFormLength: 15.04% ROI
4. Single_awayTopSix: 14.78% ROI
5. Single_awayFormLength: 14.18% ROI
6. Single_topSixBattle: 12.12% ROI
7. Single_awayWinStreak: 11.59% ROI
8. Single_combinedOverRate: 10.54% ROI
9. Over_Under_Patterns: 10.54% ROI
10. Single_handicapLine: 10.51% ROI

**Bottom 10 Performers:**
38. Position_Gap_Analysis: -11.45% ROI
39. Single_positionGap: -11.45% ROI
40. Momentum_Clash: -11.47% ROI
41. Combined_Position_Strength: -11.54% ROI
42. Single_combinedPosition: -11.54% ROI
43. Single_averagePosition: -11.54% ROI
44. Position_vs_Goal_Difference: -12.08% ROI
45. Position_Performance_Divergence: -12.16% ROI
46. Single_goalDiffMomentum: -12.66% ROI
47. Single_awayPosition: -13.00% ROI

---

*Generated on 2025-06-23T03:38:55.311Z*
*This document contains EVERY strategy tested with complete implementation details*
*All strategies use only pre-match data - zero look-ahead bias*
