// Weekly Threshold Analysis - Granular Seasonal Pattern Investigation
// Investigating why threshold theory works early season but degrades over time

module.exports = {
    name: "Weekly Threshold Analysis",
    description: "Week-by-week breakdown of threshold theory patterns to understand market learning curve",
    enabled: true,
    factors: [
        // === WEEK-BY-WEEK QUARTER FADE ANALYSIS (KEY INSIGHTS ONLY) ===
        {
            name: "fadeQuarterWeek1to2",
            expression: "(fbref.week >= 1 && fbref.week <= 2 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Quarter fade weeks 1-2 - opening weekend maximum uncertainty",
            betSide: "away"
        },
        {
            name: "fadeQuarterWeek3to4", 
            expression: "(fbref.week >= 3 && fbref.week <= 4 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Quarter fade weeks 3-4 - PEAK EDGE PERIOD",
            betSide: "away"
        },
        {
            name: "fadeQuarterWeek5to6",
            expression: "(fbref.week >= 5 && fbref.week <= 6 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0", 
            description: "Quarter fade weeks 5-6 - first month complete",
            betSide: "away"
        },
        {
            name: "fadeQuarterWeek7to8",
            expression: "(fbref.week >= 7 && fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Quarter fade weeks 7-8 - EDGE COLLAPSE PERIOD",
            betSide: "away"
        },
        // === GROUPED PERIODS (BETTER SAMPLE SIZES) ===
        {
            name: "fadeQuarterWeek9to16",
            expression: "(fbref.week >= 9 && fbref.week <= 16 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Quarter fade weeks 9-16 - mid season adaptation period",
            betSide: "away"
        },
        {
            name: "fadeQuarterWeek17to24",
            expression: "(fbref.week >= 17 && fbref.week <= 24 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Quarter fade weeks 17-24 - CHRISTMAS/NEW YEAR REVIVAL",
            betSide: "away"
        },
        {
            name: "fadeQuarterWeek25to32",
            expression: "(fbref.week >= 25 && fbref.week <= 32 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Quarter fade weeks 25-32 - late mid season",
            betSide: "away"
        },
        {
            name: "fadeQuarterWeek33to38",
            expression: "(fbref.week >= 33 && fbref.week <= 38 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Quarter fade weeks 33-38 - final stretch & season finale",
            betSide: "away"
        },

        // === HKJC SYSTEM SPECIFIC INVESTIGATIONS ===
        {
            name: "hkjcQuarterVsHalf",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : ((match.asianHandicapOdds.homeHandicap === '-0.5') ? -1 : 0)",
            description: "Compare HKJC quarter (0/-0.5) vs simple half (-0.5) performance",
            betSide: "conditional"
        },
        {
            name: "hkjcSplitHandicapEdge",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/')) ? 1 : 0",
            description: "All HKJC split handicaps vs simple handicaps - system bias test",
            betSide: "away"
        },
        {
            name: "quarterHandicapComplexity",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5' || match.asianHandicapOdds.homeHandicap === '-0.5/-1' || match.asianHandicapOdds.homeHandicap === '+0.5/+1') ? 1 : 0",
            description: "Quarter complexity creates pricing inefficiency",
            betSide: "away"
        },

        // === MARKET LEARNING CURVE THEORY ===
        {
            name: "earlySeasonConfusion",
            expression: "(fbref.week <= 6 && match.asianHandicapOdds.homeHandicap.includes('/')) ? 1 : 0",
            description: "Very early season + HKJC system = maximum confusion",
            betSide: "away"
        },
        {
            name: "midSeasonAdaptation",
            expression: "(fbref.week >= 15 && fbref.week <= 25 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Mid season - market starts learning quarter pricing",
            betSide: "away"
        },
        {
            name: "lateSeasonEfficiency",
            expression: "(fbref.week >= 30 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0", 
            description: "Late season - market fully efficient, motivation overrides bias",
            betSide: "away"
        },

        // === MOTIVATION VS BIAS THEORY ===
        {
            name: "earlyLowStakes",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Early season low stakes = bias dominates",
            betSide: "away"
        },
        {
            name: "lateHighStakes",
            expression: "(fbref.week >= 30 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && ((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.home.leaguePosition || 20) >= 17)) ? 1 : 0",
            description: "Late season high stakes (Europe/relegation) = motivation overrides bias",
            betSide: "away"
        },

        // === BLENDED PRICING INEFFICIENCY TESTS ===
        {
            name: "quarterVsComponentParts",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5' && Math.abs(match.asianHandicapOdds.homeOdds - 2.0) <= 0.1) ? 1 : 0",
            description: "Quarter handicap near even money - blended pricing confusion",
            betSide: "away"
        },
        {
            name: "splitHandicapArbitrage",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.05) ? 1 : 0",
            description: "Very tight odds on split handicaps suggest pricing inefficiency",
            betSide: "away"
        },

        // === OPTIMAL WINDOWS (BETTER SAMPLE SIZES) ===
        {
            name: "optimalQuarterWindow",
            expression: "(fbref.week >= 1 && fbref.week <= 6 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? (7 - fbref.week) : 0",
            description: "Weighted optimal quarter fade window - highest weights for best weeks",
            betSide: "away"
        },
        {
            name: "seasonalEfficiencyCurve",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5') ? Math.max(0, (10 - fbref.week) / 10) : 0",
            description: "Efficiency curve - edge decreases linearly as season progresses",
            betSide: "away"
        }
    ],
    
    combinations: [
        {
            name: "HKJC_System_Bias_Test",
            factors: [
                "match.asianHandicapOdds.homeHandicap.includes('/')",
                "fbref.week <= 8",
                "Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.15"
            ],
            hypothesis: "HKJC split system + early season + balanced odds = maximum inefficiency",
            type: "multi_factor",
            betSide: "away"
        },
        {
            name: "Market_Learning_Curve",
            factors: [
                "(fbref.week - 1) / 37", // Normalized week progression
                "match.asianHandicapOdds.homeHandicap === '0/-0.5'",
                "preMatch.enhanced.homeImpliedProb"
            ],
            hypothesis: "Edge decreases linearly as market learns + season progresses",
            type: "multi_factor", 
            betSide: "away"
        },
        {
            name: "Stakes_vs_Bias_Theory",
            factors: [
                "fbref.week >= 30",
                "((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.home.leaguePosition || 20) >= 17)",
                "match.asianHandicapOdds.homeHandicap === '0/-0.5'"
            ],
            hypothesis: "High stakes situations neutralize market bias",
            type: "multi_factor",
            betSide: "away"
        }
    ]
}; 