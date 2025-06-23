# UPDATED CONTAMINATION ANALYSIS REPORT

## 📊 Summary

- **Total Strategies Analyzed**: 150
- **Clean Strategies**: 136 (90.7%)
- **Contaminated Strategies**: 14 (9.3%)

## 🚨 Updated Contamination Sources

- **fbref.week**: 15 strategies (107.1% of contaminated)

## 🔍 Key Changes from Previous Analysis:
- Added homeXG/awayXG as contamination patterns
- More strict identification of Expected Goals contamination
- Updated clean strategy count and performance metrics

## ❌ All Contaminated Strategies (Including XG)

### 1. Adaptive_Adaptive_Ratio_AH_vs_1X2_Comparison_Plus_preMatch_fbref_week (59.59% ROI)

**Contamination Issues:**
- Factor "preMatch.fbref.week" contains "fbref.week"

**All Factors:**
- `(match.asianHandicapOdds.homeOdds) / (match.homeWinOdds)`
- `preMatch.fbref.week`

---
### 2. Early_Season_Position_Rescue (55.78% ROI)

**Contamination Issues:**
- Factor "(fbref.week <= 6) ? 1 : 0" contains "fbref.week"

**All Factors:**
- `(fbref.week <= 6) ? 1 : 0`
- `(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)`

---
### 3. CrossRule_homeCurrentStreak_x_lateSeasonTopSix (12.73% ROI)

**Contamination Issues:**
- Factor "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0" contains "fbref.week"

**All Factors:**
- `timeSeries.home.streaks.overall.current.count || 0`
- `(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0`

---
### 4. Late_Season_Pressure_Rescue (8.88% ROI)

**Contamination Issues:**
- Factor "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0" contains "fbref.week"
- Factor "(fbref.week >= 30 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0" contains "fbref.week"

**All Factors:**
- `(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0`
- `(fbref.week >= 30 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0`

---
### 5. CrossRule_homeCurrentStreak_x_motivatedPositionHome (6.14% ROI)

**Contamination Issues:**
- Factor "((timeSeries.home.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.home.leaguePosition || 20)) : (((timeSeries.home.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.home.leaguePosition || 20)) : 0)" contains "fbref.week"

**All Factors:**
- `timeSeries.home.streaks.overall.current.count || 0`
- `((timeSeries.home.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.home.leaguePosition || 20)) : (((timeSeries.home.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.home.leaguePosition || 20)) : 0)`

---
### 6. CrossRule_weekInSeason_x_titleRacePressure (2.98% ROI)

**Contamination Issues:**
- Factor "fbref.week" contains "fbref.week"

**All Factors:**
- `fbref.week`
- `Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))`

---
### 7. Season_Fatigue (1.88% ROI)

**Contamination Issues:**
- Factor "fbref.week" contains "fbref.week"

**All Factors:**
- `fbref.week`

---
### 8. Single_weekInSeason (1.88% ROI)

**Contamination Issues:**
- Factor "fbref.week" contains "fbref.week"

**All Factors:**
- `fbref.week`

---
### 9. CrossRule_weekInSeason_x_homeCurrentStreak (0.33% ROI)

**Contamination Issues:**
- Factor "fbref.week" contains "fbref.week"

**All Factors:**
- `fbref.week`
- `timeSeries.home.streaks.overall.current.count || 0`

---
### 10. Six_Pointer_Rescue (-1.84% ROI)

**Contamination Issues:**
- Factor "fbref.week" contains "fbref.week"

**All Factors:**
- `((timeSeries.home.leaguePosition || 20) >= 17 && (timeSeries.away.leaguePosition || 20) >= 17) ? 1 : 0`
- `fbref.week`

---
### 11. CrossRule_weekInSeason_x_homeWinOdds (-4.11% ROI)

**Contamination Issues:**
- Factor "fbref.week" contains "fbref.week"

**All Factors:**
- `fbref.week`
- `match.homeWinOdds`

---
### 12. CrossRule_weekInSeason_x_homePosition (-21.87% ROI)

**Contamination Issues:**
- Factor "fbref.week" contains "fbref.week"

**All Factors:**
- `fbref.week`
- `timeSeries.home.leaguePosition || 20`

---
### 13. CrossRule_homePosition_x_lateSeasonTopSix (-34.66% ROI)

**Contamination Issues:**
- Factor "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0" contains "fbref.week"

**All Factors:**
- `timeSeries.home.leaguePosition || 20`
- `(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0`

---
### 14. CrossRule_homePosition_x_motivatedPositionHome (-34.66% ROI)

**Contamination Issues:**
- Factor "((timeSeries.home.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.home.leaguePosition || 20)) : (((timeSeries.home.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.home.leaguePosition || 20)) : 0)" contains "fbref.week"

**All Factors:**
- `timeSeries.home.leaguePosition || 20`
- `((timeSeries.home.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.home.leaguePosition || 20)) : (((timeSeries.home.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.home.leaguePosition || 20)) : 0)`

---

*This report identifies all strategies using post-match data (including XG) that should be excluded*
