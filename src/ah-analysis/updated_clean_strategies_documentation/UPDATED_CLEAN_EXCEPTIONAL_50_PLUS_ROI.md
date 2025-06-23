# UPDATED CLEAN EXCEPTIONAL 50 PLUS ROI

## 📊 Tier Summary
- **Updated Clean Strategy Count**: 16
- **Average ROI**: 56.56%

## 1. Adaptive_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_homeImpliedProb

**Performance:**
- 💰 ROI: 59.79%
- 📊 Correlation: 0.4479
- 🎯 Accuracy: 75.9%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: match.asianHandicapOdds.homeOdds, match.homeWinOdds, preMatch.enhanced.homeImpliedProb
- 💡 Hypothesis: Extending successful AH_vs_1X2_Comparison with preMatch.enhanced.homeImpliedProb

**Clean Factor Breakdown:**
  - `match.asianHandicapOdds.homeOdds`
  - `match.homeWinOdds`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 2. Adaptive_Ratio_AH_vs_1X2_Comparison

**Performance:**
- 💰 ROI: 59.63%
- 📊 Correlation: 0.4607
- 🎯 Accuracy: 72.3%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive_ratio
- 🧠 Verified Clean Factors: (match.asianHandicapOdds.homeOdds) / (match.homeWinOdds)
- 💡 Hypothesis: Ratio of successful factors in AH_vs_1X2_Comparison

**Clean Factor Breakdown:**
  - `(match.asianHandicapOdds.homeOdds) / (match.homeWinOdds)`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 3. Adaptive_Adaptive_Ratio_AH_vs_1X2_Comparison_Plus_preMatch_enhanced_homeValueBet

**Performance:**
- 💰 ROI: 59.63%
- 📊 Correlation: 0.4606
- 🎯 Accuracy: 72.3%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: (match.asianHandicapOdds.homeOdds) / (match.homeWinOdds), preMatch.enhanced.homeValueBet
- 💡 Hypothesis: Extending successful Adaptive_Ratio_AH_vs_1X2_Comparison with preMatch.enhanced.homeValueBet

**Clean Factor Breakdown:**
  - `(match.asianHandicapOdds.homeOdds) / (match.homeWinOdds)`
  - `preMatch.enhanced.homeValueBet`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 4. Single_awayWinOdds

**Performance:**
- 💰 ROI: 59.62%
- 📊 Correlation: 0.3573
- 🎯 Accuracy: 75.9%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.awayWinOdds
- 💡 Hypothesis: 1X2 away win odds predicts AH outcomes

**Clean Factor Breakdown:**
  - `match.awayWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 5. Rising_Underdog_Back

**Performance:**
- 💰 ROI: 59.41%
- 📊 Correlation: 0.3519
- 🎯 Accuracy: 75.7%
- 📈 Sample Size: 1074

**Strategy Details:**
- 🏷️ Type: momentum_undervaluation
- 🧠 Verified Clean Factors: ((timeSeries.away.leaguePosition || 20) >= 12 && (timeSeries.away.streaks.overall.current.type === 'W' || timeSeries.away.streaks.overall.current.type === 'win') && (timeSeries.away.streaks.overall.current.count || 0) >= 2 && enhanced.preMatch.marketEfficiency.awayImpliedProb < 0.25) ? 1 : 0, match.awayWinOdds
- 💡 Hypothesis: Back lower table away teams on winning streaks that market undervalues

**Clean Factor Breakdown:**
  - `((timeSeries.away.leaguePosition || 20) >= 12 && (timeSeries.away.streaks.overall.current.type === 'W' || timeSeries.away.streaks.overall.current.type === 'win') && (timeSeries.away.streaks.overall.current.count || 0) >= 2 && enhanced.preMatch.marketEfficiency.awayImpliedProb < 0.25) ? 1 : 0`
  - `match.awayWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 6. Adaptive_Position_vs_Form_Plus_preMatch_enhanced_homeImpliedProb

**Performance:**
- 💰 ROI: 58.83%
- 📊 Correlation: 0.4428
- 🎯 Accuracy: 74.8%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20), (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0), preMatch.enhanced.homeImpliedProb
- 💡 Hypothesis: Extending successful Position_vs_Form with preMatch.enhanced.homeImpliedProb

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 7. Adaptive_Falling_Giant_Fade_Plus_preMatch_enhanced_homeImpliedProb

**Performance:**
- 💰 ROI: 58.38%
- 📊 Correlation: 0.4477
- 🎯 Accuracy: 74.8%
- 📈 Sample Size: 1078

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: ((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0, match.homeWinOdds, preMatch.enhanced.homeImpliedProb
- 💡 Hypothesis: Extending successful Falling_Giant_Fade with preMatch.enhanced.homeImpliedProb

**Clean Factor Breakdown:**
  - `((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && enhanced.preMatch.marketEfficiency.homeImpliedProb > 0.5) ? 1 : 0`
  - `match.homeWinOdds`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 8. Adaptive_Single_homeWinOdds_Plus_preMatch_enhanced_homeImpliedProb

**Performance:**
- 💰 ROI: 58.37%
- 📊 Correlation: 0.4473
- 🎯 Accuracy: 75.0%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: match.homeWinOdds, preMatch.enhanced.homeImpliedProb
- 💡 Hypothesis: Extending successful Single_homeWinOdds with preMatch.enhanced.homeImpliedProb

**Clean Factor Breakdown:**
  - `match.homeWinOdds`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 9. Adaptive_Single_handicapLine_Plus_preMatch_enhanced_homeImpliedProb

**Performance:**
- 💰 ROI: 57.81%
- 📊 Correlation: 0.4510
- 🎯 Accuracy: 75.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: adaptive
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]), preMatch.enhanced.homeImpliedProb
- 💡 Hypothesis: Extending successful Single_handicapLine with preMatch.enhanced.homeImpliedProb

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])`
  - `preMatch.enhanced.homeImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 10. Position_Gap_Analysis

**Performance:**
- 💰 ROI: 54.57%
- 📊 Correlation: 0.3733
- 🎯 Accuracy: 69.2%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: position_differential
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)
- 💡 Hypothesis: Large position gaps create predictable handicap value

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 11. Single_positionGap

**Performance:**
- 💰 ROI: 54.57%
- 📊 Correlation: 0.3733
- 🎯 Accuracy: 69.2%
- 📈 Sample Size: 1126

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)
- 💡 Hypothesis: League position gap (away - home, positive = home higher) predicts AH outcomes

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 12. Position_vs_Form

**Performance:**
- 💰 ROI: 53.75%
- 📊 Correlation: 0.3783
- 🎯 Accuracy: 69.3%
- 📈 Sample Size: 1096

**Strategy Details:**
- 🏷️ Type: position_form_divergence
- 🧠 Verified Clean Factors: (timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20), (timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)
- 💡 Hypothesis: Position vs current form creates value when they diverge

**Clean Factor Breakdown:**
  - `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`
  - `(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 13. Single_enhanced_marketEfficiency_awayImpliedProb

**Performance:**
- 💰 ROI: 53.65%
- 📊 Correlation: 0.4082
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: enhanced.marketEfficiency.awayImpliedProb
- 💡 Hypothesis: enhanced.marketEfficiency.awayImpliedProb directly predicts AH profit

**Clean Factor Breakdown:**
  - `enhanced.marketEfficiency.awayImpliedProb`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 14. Single_match_homeWinOdds___match_awayWinOdds

**Performance:**
- 💰 ROI: 53.47%
- 📊 Correlation: 0.3238
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.homeWinOdds / match.awayWinOdds
- 💡 Hypothesis: match.homeWinOdds / match.awayWinOdds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.homeWinOdds / match.awayWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 15. Single_match_homeWinOdds

**Performance:**
- 💰 ROI: 52.78%
- 📊 Correlation: 0.3432
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: match.homeWinOdds
- 💡 Hypothesis: match.homeWinOdds directly predicts AH profit

**Clean Factor Breakdown:**
  - `match.homeWinOdds`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
## 16. Single_parseFloat_match_asianHandicapOdds_homeHandicap_split______0__

**Performance:**
- 💰 ROI: 50.71%
- 📊 Correlation: 0.3927
- 🎯 Accuracy: 0.0%
- 📈 Sample Size: 1125

**Strategy Details:**
- 🏷️ Type: single
- 🧠 Verified Clean Factors: parseFloat(match.asianHandicapOdds.homeHandicap.split("/")[0])
- 💡 Hypothesis: parseFloat(match.asianHandicapOdds.homeHandicap.split("/")[0]) directly predicts AH profit

**Clean Factor Breakdown:**
  - `parseFloat(match.asianHandicapOdds.homeHandicap.split("/")[0])`

**Implementation Recommendation:**
✅ **IMPLEMENT IMMEDIATELY** - High confidence clean strategy (no XG contamination)

---
