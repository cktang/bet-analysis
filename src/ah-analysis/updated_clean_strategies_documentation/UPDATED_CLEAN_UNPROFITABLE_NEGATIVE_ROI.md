# UPDATED CLEAN UNPROFITABLE NEGATIVE ROI

## 📊 Tier Summary
- **Updated Clean Strategy Count**: 55
- **Average ROI**: -17.01%

## 1. Single_homeVenueStreak

**Performance:**
- 💰 ROI: -0.22%
- 📊 Correlation: 0.0514
- 🎯 Accuracy: 48.3%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.streaks.venue.current.count || 0
- 💡 Hypothesis: Home team current venue streak predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.venue.current.count || 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 2. Hot_vs_Cold_Teams

**Performance:**
- 💰 ROI: -0.34%
- 📊 Correlation: 0.0256
- 🎯 Accuracy: 48.6%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: form_extreme
- 🧠 Verified Clean Factors: Math.max(timeSeries.home.streaks.overall.longest.win || 0, timeSeries.away.streaks.overall.longest.win || 0), Math.max(timeSeries.home.streaks.overall.longest.loss || 0, timeSeries.away.streaks.overall.longest.loss || 0)
- 💡 Hypothesis: Extreme form differences (hot vs cold) create betting opportunities

**Clean Factor Breakdown:**
  - `Math.max(timeSeries.home.streaks.overall.longest.win || 0, timeSeries.away.streaks.overall.longest.win || 0)`
  - `Math.max(timeSeries.home.streaks.overall.longest.loss || 0, timeSeries.away.streaks.overall.longest.loss || 0)`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 3. Single_awayVenueStreak

**Performance:**
- 💰 ROI: -0.35%
- 📊 Correlation: 0.0238
- 🎯 Accuracy: 48.3%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.streaks.venue.current.count || 0
- 💡 Hypothesis: Away team current venue streak predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.streaks.venue.current.count || 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 4. Single_extremeHomeFavorite

**Performance:**
- 💰 ROI: -0.42%
- 📊 Correlation: 0.0647
- 🎯 Accuracy: 49.1%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.8) ? 1 : 0
- 💡 Hypothesis: Extreme home favorites (>80% implied probability) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.8) ? 1 : 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 5. Single_fbref_attendance

**Performance:**
- 💰 ROI: -0.91%
- 📊 Correlation: 0.1824
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1124

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: fbref.attendance
- 💡 Hypothesis: fbref.attendance directly predicts AH profit

**Clean Factor Breakdown:**
  - `fbref.attendance`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 6. Relegation_Desperation

**Performance:**
- 💰 ROI: -0.92%
- 📊 Correlation: 0.0659
- 🎯 Accuracy: 47.3%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: survival_motivation
- 🧠 Verified Clean Factors: (timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0, (timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0
- 💡 Hypothesis: Relegation battles create desperate performance affecting handicaps

**Clean Factor Breakdown:**
  - `(timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0`
  - `(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 7. Single_over2_5Odds

**Performance:**
- 💰 ROI: -0.98%
- 📊 Correlation: 0.0368
- 🎯 Accuracy: 46.5%
- 📈 Sample Size: 845

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.over2_5Odds
- 💡 Hypothesis: Over 2.5 goals odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `match.over2_5Odds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 8. Single_meaningfulPositionGap

**Performance:**
- 💰 ROI: -1.25%
- 📊 Correlation: 0.0825
- 🎯 Accuracy: 48.0%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0
- 💡 Hypothesis: Large position gaps only matter when European spots or relegation involved predicts AH outcomes

**Clean Factor Breakdown:**
  - `(Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 9. Smart_Position_Gap

**Performance:**
- 💰 ROI: -1.25%
- 📊 Correlation: 0.0825
- 🎯 Accuracy: 48.0%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: contextual_position
- 🧠 Verified Clean Factors: (Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0, ((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20) > 5) && ((timeSeries.home.streaks.overall.form.winRate || 0) - (timeSeries.away.streaks.overall.form.winRate || 0) > 0.3) ? 1 : 0
- 💡 Hypothesis: Position gaps work when stakes are involved and form aligns

**Clean Factor Breakdown:**
  - `(Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0`
  - `((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20) > 5) && ((timeSeries.home.streaks.overall.form.winRate || 0) - (timeSeries.away.streaks.overall.form.winRate || 0) > 0.3) ? 1 : 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 10. Single_homeBottomThree

**Performance:**
- 💰 ROI: -1.60%
- 📊 Correlation: 0.0600
- 🎯 Accuracy: 47.8%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0
- 💡 Hypothesis: Home team in relegation zone (bottom 3) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 11. Single_match_drawOdds

**Performance:**
- 💰 ROI: -1.99%
- 📊 Correlation: 0.1705
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.drawOdds
- 💡 Hypothesis: match.drawOdds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.drawOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 12. CrossRule_homeCurrentStreak_x_homeImpliedProb

**Performance:**
- 💰 ROI: -2.00%
- 📊 Correlation: 0.0267
- 🎯 Accuracy: 48.8%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0, enhanced.preMatch.marketEfficiency.homeImpliedProb
- 💡 Hypothesis: Home team current streak length combined with Implied probability of home win from odds

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 13. Single_awayCurrentStreak

**Performance:**
- 💰 ROI: -2.22%
- 📊 Correlation: 0.0438
- 🎯 Accuracy: 47.9%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.away.streaks.overall.current.count || 0
- 💡 Hypothesis: Away team current streak length predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.away.streaks.overall.current.count || 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 14. Home_Advantage

**Performance:**
- 💰 ROI: -2.38%
- 📊 Correlation: 0.0007
- 🎯 Accuracy: 48.4%
- 📈 Sample Size: 1124

**Strategy Details:**
- 🏷️ Type: contextual
- 🧠 Verified Clean Factors: fbref.attendance, enhanced.preMatch.marketEfficiency.homeImpliedProb
- 💡 Hypothesis: Higher attendance correlates with stronger home advantage

**Clean Factor Breakdown:**
  - `fbref.attendance`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 15. Single_ahAwayOdds

**Performance:**
- 💰 ROI: -2.50%
- 📊 Correlation: 0.0190
- 🎯 Accuracy: 47.4%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.asianHandicapOdds.awayOdds
- 💡 Hypothesis: Asian Handicap away odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `match.asianHandicapOdds.awayOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 16. Single_totalImpliedProb

**Performance:**
- 💰 ROI: -2.83%
- 📊 Correlation: 0.0271
- 🎯 Accuracy: 46.1%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.totalImpliedProb
- 💡 Hypothesis: Total implied probability (shows overround) predicts AH outcomes

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.totalImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 17. Overround_Analysis

**Performance:**
- 💰 ROI: -2.83%
- 📊 Correlation: 0.0271
- 🎯 Accuracy: 46.1%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: market_analysis
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.totalImpliedProb, enhanced.preMatch.marketEfficiency.cutPercentage
- 💡 Hypothesis: High overround markets may have less efficient pricing

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.totalImpliedProb`
  - `enhanced.preMatch.marketEfficiency.cutPercentage`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 18. Single_cutPercentage

**Performance:**
- 💰 ROI: -2.83%
- 📊 Correlation: 0.0271
- 🎯 Accuracy: 46.1%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.cutPercentage
- 💡 Hypothesis: Bookmaker margin/cut percentage predicts AH outcomes

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.cutPercentage`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 19. Streak_Momentum

**Performance:**
- 💰 ROI: -2.86%
- 📊 Correlation: 0.0396
- 🎯 Accuracy: 50.0%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: momentum
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0, timeSeries.away.streaks.overall.current.count || 0
- 💡 Hypothesis: Current form streaks predict Asian Handicap outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `timeSeries.away.streaks.overall.current.count || 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 20. Single_under2_5Odds

**Performance:**
- 💰 ROI: -3.35%
- 📊 Correlation: 0.0056
- 🎯 Accuracy: 47.2%
- 📈 Sample Size: 845

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.under2_5Odds
- 💡 Hypothesis: Under 2.5 goals odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `match.under2_5Odds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 21. Goals_Market_Efficiency

**Performance:**
- 💰 ROI: -5.77%
- 📊 Correlation: 0.0400
- 🎯 Accuracy: 45.0%
- 📈 Sample Size: 845

**Strategy Details:**
- 🏷️ Type: market_analysis
- 🧠 Verified Clean Factors: match.over2_5Odds, match.under2_5Odds
- 💡 Hypothesis: Over/under odds relationship shows market efficiency

**Clean Factor Breakdown:**
  - `match.over2_5Odds`
  - `match.under2_5Odds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 22. Single_homeImpliedProb

**Performance:**
- 💰 ROI: -6.26%
- 📊 Correlation: 0.0582
- 🎯 Accuracy: 46.7%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.homeImpliedProb
- 💡 Hypothesis: Implied probability of home win from odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 23. Market_Bias

**Performance:**
- 💰 ROI: -7.46%
- 📊 Correlation: 0.0549
- 🎯 Accuracy: 46.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb
- 💡 Hypothesis: Market bias toward home/away indicates value opportunities

**Clean Factor Breakdown:**
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 24. Single_giantKilling

**Performance:**
- 💰 ROI: -7.52%
- 📊 Correlation: 0.2252
- 🎯 Accuracy: 35.8%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0
- 💡 Hypothesis: Lower team vs top 6 (giant killing scenario) predicts AH outcomes

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 25. Single_positionGapAbs

**Performance:**
- 💰 ROI: -8.14%
- 📊 Correlation: 0.0490
- 🎯 Accuracy: 44.4%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))
- 💡 Hypothesis: Absolute league position gap between teams predicts AH outcomes

**Clean Factor Breakdown:**
  - `Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 26. Streak_vs_Quality

**Performance:**
- 💰 ROI: -9.09%
- 📊 Correlation: 0.0684
- 🎯 Accuracy: 44.8%
- 📈 Sample Size: 726

**Strategy Details:**
- 🏷️ Type: momentum_vs_ability
- 🧠 Verified Clean Factors: Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)), Math.abs(enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb)
- 💡 Hypothesis: Streak momentum vs underlying quality creates mispricing

**Clean Factor Breakdown:**
  - `Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))`
  - `Math.abs(enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb)`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 27. Combined_Position_Strength

**Performance:**
- 💰 ROI: -9.42%
- 📊 Correlation: 0.0728
- 🎯 Accuracy: 44.3%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: match_quality
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2
- 💡 Hypothesis: Average team quality affects match competitiveness and handicap accuracy

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 28. Single_combinedPosition

**Performance:**
- 💰 ROI: -9.42%
- 📊 Correlation: 0.0728
- 🎯 Accuracy: 44.3%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)
- 💡 Hypothesis: Combined league positions (lower = better teams) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 29. Single_averagePosition

**Performance:**
- 💰 ROI: -9.42%
- 📊 Correlation: 0.0728
- 🎯 Accuracy: 44.3%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2
- 💡 Hypothesis: Average league position of both teams predicts AH outcomes

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 30. Quality_Team_Overreaction

**Performance:**
- 💰 ROI: -9.59%
- 📊 Correlation: 0.0619
- 🎯 Accuracy: 44.1%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: overreaction_fade
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) <= 10 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.3 && (timeSeries.home.streaks.overall.form.length || 0) >= 3) ? 1 : 0, enhanced.preMatch.marketEfficiency.homeImpliedProb
- 💡 Hypothesis: Market overreacts to good teams in temporary bad form

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) <= 10 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.3 && (timeSeries.home.streaks.overall.form.length || 0) >= 3) ? 1 : 0`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 31. Form_Position_Divergence_Rescue

**Performance:**
- 💰 ROI: -9.59%
- 📊 Correlation: 0.0619
- 🎯 Accuracy: 44.1%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: overreaction_rescue
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.4) ? 1 : 0, enhanced.preMatch.marketEfficiency.homeImpliedProb
- 💡 Hypothesis: Market overvalues good teams in bad form - rescue for form vs ability disconnect

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.4) ? 1 : 0`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 32. Single_enhanced_marketEfficiency_homeImpliedProb

**Performance:**
- 💰 ROI: -9.77%
- 📊 Correlation: 0.4141
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.marketEfficiency.homeImpliedProb
- 💡 Hypothesis: enhanced.marketEfficiency.homeImpliedProb directly predicts AH profit

**Clean Factor Breakdown:**
  - `enhanced.marketEfficiency.homeImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 33. Single_match_awayWinOdds

**Performance:**
- 💰 ROI: -10.09%
- 📊 Correlation: 0.3296
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.awayWinOdds
- 💡 Hypothesis: match.awayWinOdds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.awayWinOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 34. Single_enhanced_marketEfficiency_homeImpliedProb___enhanced_marketEfficiency_awayImpliedProb

**Performance:**
- 💰 ROI: -10.21%
- 📊 Correlation: 0.4142
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.marketEfficiency.homeImpliedProb - enhanced.marketEfficiency.awayImpliedProb
- 💡 Hypothesis: enhanced.marketEfficiency.homeImpliedProb - enhanced.marketEfficiency.awayImpliedProb directly predicts AH profit

**Clean Factor Breakdown:**
  - `enhanced.marketEfficiency.homeImpliedProb - enhanced.marketEfficiency.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 35. AH_Momentum_vs_Market

**Performance:**
- 💰 ROI: -10.29%
- 📊 Correlation: 0.0579
- 🎯 Accuracy: 43.9%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: market_vs_form
- 🧠 Verified Clean Factors: (timeSeries.home.cumulative.markets.asianHandicapWinRate || 0) - (timeSeries.away.cumulative.markets.asianHandicapWinRate || 0), enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb
- 💡 Hypothesis: Asian Handicap form vs market expectations reveals value

**Clean Factor Breakdown:**
  - `(timeSeries.home.cumulative.markets.asianHandicapWinRate || 0) - (timeSeries.away.cumulative.markets.asianHandicapWinRate || 0)`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 36. Position_Quality_Mismatch

**Performance:**
- 💰 ROI: -10.47%
- 📊 Correlation: 0.0831
- 🎯 Accuracy: 43.5%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: quality_vs_market
- 🧠 Verified Clean Factors: Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)), enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb
- 💡 Hypothesis: Large position gaps vs market odds reveal mispricing

**Clean Factor Breakdown:**
  - `Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))`
  - `enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 37. Position_Performance_Divergence

**Performance:**
- 💰 ROI: -12.16%
- 📊 Correlation: 0.0962
- 🎯 Accuracy: 43.0%
- 📈 Sample Size: 746

**Strategy Details:**
- 🏷️ Type: expectation_mismatch
- 🧠 Verified Clean Factors: (timeSeries.home.leaguePosition || 20) / (enhanced.preMatch.marketEfficiency.homeImpliedProb * 20), (timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)
- 💡 Hypothesis: Teams whose position doesn't match market expectation offer value

**Clean Factor Breakdown:**
  - `(timeSeries.home.leaguePosition || 20) / (enhanced.preMatch.marketEfficiency.homeImpliedProb * 20)`
  - `(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 38. Single_homeLossStreak

**Performance:**
- 💰 ROI: -21.91%
- 📊 Correlation: 0.2008
- 🎯 Accuracy: 28.0%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.longest.loss || 0
- 💡 Hypothesis: Home team longest loss streak this season predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.longest.loss || 0`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 39. CrossRule_homePosition_x_titleRacePressure

**Performance:**
- 💰 ROI: -22.96%
- 📊 Correlation: 0.2274
- 🎯 Accuracy: 27.7%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.leaguePosition || 20, Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))
- 💡 Hypothesis: Home team current league position combined with Combined title race pressure - HIGH values for top teams (profitable strategy - renamed from relegationPressure)

**Clean Factor Breakdown:**
  - `timeSeries.home.leaguePosition || 20`
  - `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 40. CrossRule_homePosition_x_streakDifferential

**Performance:**
- 💰 ROI: -30.79%
- 📊 Correlation: 0.2888
- 🎯 Accuracy: 24.5%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.leaguePosition || 20, (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)
- 💡 Hypothesis: Home team current league position combined with Current streak differential (home - away)

**Clean Factor Breakdown:**
  - `timeSeries.home.leaguePosition || 20`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 41. Single_homePosition

**Performance:**
- 💰 ROI: -34.80%
- 📊 Correlation: 0.3073
- 🎯 Accuracy: 22.6%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: timeSeries.home.leaguePosition || 20
- 💡 Hypothesis: Home team current league position predicts AH outcomes

**Clean Factor Breakdown:**
  - `timeSeries.home.leaguePosition || 20`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 42. CrossRule_homeCurrentStreak_x_homePosition

**Performance:**
- 💰 ROI: -34.91%
- 📊 Correlation: 0.3035
- 🎯 Accuracy: 22.6%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.streaks.overall.current.count || 0, timeSeries.home.leaguePosition || 20
- 💡 Hypothesis: Home team current streak length combined with Home team current league position

**Clean Factor Breakdown:**
  - `timeSeries.home.streaks.overall.current.count || 0`
  - `timeSeries.home.leaguePosition || 20`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 43. CrossRule_homePosition_x_homeWinOdds

**Performance:**
- 💰 ROI: -39.70%
- 📊 Correlation: 0.3693
- 🎯 Accuracy: 20.3%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: cross_rule
- 🧠 Verified Clean Factors: timeSeries.home.leaguePosition || 20, match.homeWinOdds
- 💡 Hypothesis: Home team current league position combined with 1X2 home win odds

**Clean Factor Breakdown:**
  - `timeSeries.home.leaguePosition || 20`
  - `match.homeWinOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 44. Adaptive_Single_handicapLine_Plus_timeSeries_away_patterns_winRate

**Performance:**
- 💰 ROI: -43.62%
- 📊 Correlation: 0.4370
- 🎯 Accuracy: 18.4%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), timeSeries.away.patterns.winRate
- 💡 Hypothesis: Extending successful Single_handicapLine with timeSeries.away.patterns.winRate

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `timeSeries.away.patterns.winRate`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 45. Adaptive_Single_handicapLine_Plus_timeSeries_home_patterns_winRate

**Performance:**
- 💰 ROI: -44.40%
- 📊 Correlation: 0.4252
- 🎯 Accuracy: 18.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), timeSeries.home.patterns.winRate
- 💡 Hypothesis: Extending successful Single_handicapLine with timeSeries.home.patterns.winRate

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `timeSeries.home.patterns.winRate`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 46. Adaptive_Position_vs_Form_Plus_preMatch_enhanced_awayImpliedProb

**Performance:**
- 💰 ROI: -44.96%
- 📊 Correlation: 0.4173
- 🎯 Accuracy: 18.0%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20), (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0), preMatch.enhanced.awayImpliedProb
- 💡 Hypothesis: Extending successful Position_vs_Form with preMatch.enhanced.awayImpliedProb

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 47. Adaptive_Single_handicapLine_Plus_preMatch_enhanced_hadCut

**Performance:**
- 💰 ROI: -45.66%
- 📊 Correlation: 0.4165
- 🎯 Accuracy: 16.5%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), preMatch.enhanced.hadCut
- 💡 Hypothesis: Extending successful Single_handicapLine with preMatch.enhanced.hadCut

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.enhanced.hadCut`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 48. Adaptive_Single_handicapLine_Plus_preMatch_match_asianHandicapOdds_awayOdds

**Performance:**
- 💰 ROI: -47.04%
- 📊 Correlation: 0.4475
- 🎯 Accuracy: 16.6%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), preMatch.match.asianHandicapOdds.awayOdds
- 💡 Hypothesis: Extending successful Single_handicapLine with preMatch.match.asianHandicapOdds.awayOdds

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.match.asianHandicapOdds.awayOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 49. Adaptive_Single_handicapLine_Plus_preMatch_match_asianHandicapOdds_homeOdds

**Performance:**
- 💰 ROI: -47.44%
- 📊 Correlation: 0.4414
- 🎯 Accuracy: 15.9%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), preMatch.match.asianHandicapOdds.homeOdds
- 💡 Hypothesis: Extending successful Single_handicapLine with preMatch.match.asianHandicapOdds.homeOdds

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.match.asianHandicapOdds.homeOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 50. Adaptive_Single_handicapLine_Plus_preMatch_match_homeWinOdds

**Performance:**
- 💰 ROI: -47.65%
- 📊 Correlation: 0.4293
- 🎯 Accuracy: 15.9%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), preMatch.match.homeWinOdds
- 💡 Hypothesis: Extending successful Single_handicapLine with preMatch.match.homeWinOdds

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.match.homeWinOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 51. Adaptive_Falling_Giant_Fade_Plus_preMatch_enhanced_awayImpliedProb

**Performance:**
- 💰 ROI: -48.13%
- 📊 Correlation: 0.4531
- 🎯 Accuracy: 15.9%
- 📈 Sample Size: 1078

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0, match.homeWinOdds, preMatch.enhanced.awayImpliedProb
- 💡 Hypothesis: Extending successful Falling_Giant_Fade with preMatch.enhanced.awayImpliedProb

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`
  - `match.homeWinOdds`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 52. Adaptive_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_awayImpliedProb

**Performance:**
- 💰 ROI: -48.14%
- 📊 Correlation: 0.4538
- 🎯 Accuracy: 16.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: match.asianHandicapOdds.homeOdds, match.homeWinOdds, preMatch.enhanced.awayImpliedProb
- 💡 Hypothesis: Extending successful AH_vs_1X2_Comparison with preMatch.enhanced.awayImpliedProb

**Clean Factor Breakdown:**
  - `match.asianHandicapOdds.homeOdds`
  - `match.homeWinOdds`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 53. Adaptive_Single_handicapLine_Plus_preMatch_enhanced_awayImpliedProb

**Performance:**
- 💰 ROI: -48.16%
- 📊 Correlation: 0.4563
- 🎯 Accuracy: 16.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), preMatch.enhanced.awayImpliedProb
- 💡 Hypothesis: Extending successful Single_handicapLine with preMatch.enhanced.awayImpliedProb

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 54. Adaptive_Single_homeWinOdds_Plus_preMatch_enhanced_awayImpliedProb

**Performance:**
- 💰 ROI: -48.28%
- 📊 Correlation: 0.4540
- 🎯 Accuracy: 15.9%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: match.homeWinOdds, preMatch.enhanced.awayImpliedProb
- 💡 Hypothesis: Extending successful Single_homeWinOdds with preMatch.enhanced.awayImpliedProb

**Clean Factor Breakdown:**
  - `match.homeWinOdds`
  - `preMatch.enhanced.awayImpliedProb`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
## 55. Falling_Giant_Fade

**Performance:**
- 💰 ROI: -48.38%
- 📊 Correlation: 0.3905
- 🎯 Accuracy: 15.5%
- 📈 Sample Size: 1078

**Strategy Details:**
- 🏷️ Type: reverse_psychology
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0, match.homeWinOdds
- 💡 Hypothesis: Fade quality home teams on losing streaks that market still backs

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`
  - `match.homeWinOdds`

**Implementation Recommendation:**
❌ **AVOID** - Unprofitable

---
