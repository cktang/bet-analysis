// Advanced positional strategy factors (pre-match only)

module.exports = {
    name: "Positional Strategy Factors",
    description: "Advanced league position strategies and behavioral patterns",
    enabled: true,
    factors: [
        // Position pressure indicators
        {
            name: "titleRacePressure",
            expression: "Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))",
            description: "Combined title race pressure - HIGH values for top teams (profitable strategy - renamed from relegationPressure)"
        },
        {
            name: "relegationPressure",
            expression: "Math.max(0, (timeSeries.home.leaguePosition || 20) - 17) + Math.max(0, (timeSeries.away.leaguePosition || 20) - 17)",
            description: "Combined relegation pressure - HIGH values for teams in positions 18+ (FIXED FORMULA)"
        },
        {
            name: "europeanPressure", 
            expression: "Math.max(0, 7 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 7 - (timeSeries.away.leaguePosition || 20))",
            description: "Combined European qualification pressure"
        },
        {
            name: "titlePressure",
            expression: "Math.max(0, 5 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 5 - (timeSeries.away.leaguePosition || 20))",
            description: "Combined title race pressure (top 4)"
        },
        
        // Positional momentum
        {
            name: "positionVsExpectation",
            expression: "(timeSeries.home.leaguePosition || 20) / (preMatch.enhanced.homeImpliedProb / 5)",
            description: "Home position vs market expectation ratio"
        },
        {
            name: "underperformingTeam",
            expression: "((timeSeries.home.leaguePosition || 20) > 10 && preMatch.enhanced.homeImpliedProb > 50) ? 1 : 0",
            description: "Team in lower half but market still favors them"
        },
        {
            name: "overperformingTeam",
            expression: "((timeSeries.home.leaguePosition || 20) < 10 && preMatch.enhanced.homeImpliedProb < 30) ? 1 : 0",
            description: "Team in upper half but market doesn't favor them"
        },
        
        // Specific battle scenarios
        {
            name: "topSixBattle",
            expression: "((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.away.leaguePosition || 20) <= 8) ? 1 : 0",
            description: "Both teams competing for European spots"
        },
        {
            name: "relegationBattle",
            expression: "((timeSeries.home.leaguePosition || 20) >= 16 && (timeSeries.away.leaguePosition || 20) >= 16) ? 1 : 0",
            description: "Both teams fighting relegation"
        },
        {
            name: "giantKilling",
            expression: "((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Lower team vs top 6 (giant killing scenario)"
        },
        {
            name: "safeMidTable",
            expression: "((timeSeries.home.leaguePosition || 20) > 8 && (timeSeries.home.leaguePosition || 20) < 16 && (timeSeries.away.leaguePosition || 20) > 8 && (timeSeries.away.leaguePosition || 20) < 16) ? 1 : 0",
            description: "Both teams in safe mid-table positions"
        },
        
        // Position + timing combinations
        {
            name: "lateSeasonPressure",
            expression: "(fbref.week >= 30) ? (Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))) : 0",
            description: "Late season relegation pressure multiplier"
        },
        {
            name: "earlySeasonPosition",
            expression: "(fbref.week <= 10) ? Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) : 0",
            description: "Early season position gaps (less reliable)"
        }
    ],
    combinations: [
        {
            name: "Title_Race_Pressure_Index",
            factors: [
                "Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))",
                "fbref.week"
            ],
            hypothesis: "Title race pressure between top teams creates betting value opportunities",
            type: "elite_competition_pressure"
        },
        {
            name: "Relegation_Desperation_Index_FIXED",
            factors: [
                "Math.max(0, (timeSeries.home.leaguePosition || 20) - 17) + Math.max(0, (timeSeries.away.leaguePosition || 20) - 17)",
                "fbref.week"
            ],
            hypothesis: "Relegation pressure intensifies throughout season affecting handicap performance (FIXED FORMULA)",
            type: "survival_pressure"
        },
        {
            name: "European_Stakes_Multiplier",
            factors: [
                "Math.max(0, 7 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 7 - (timeSeries.away.leaguePosition || 20))",
                "preMatch.enhanced.homeImpliedProb - preMatch.enhanced.awayImpliedProb"
            ],
            hypothesis: "European pressure vs market expectations creates value opportunities",
            type: "ambition_vs_market"
        },
        {
            name: "Giant_Killing_Value",
            factors: [
                "((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0",
                "preMatch.enhanced.awayImpliedProb"
            ],
            hypothesis: "Lower teams vs top 6 create systematic handicap value",
            type: "david_vs_goliath"
        },
        {
            name: "Mid_Table_Mediocrity",
            factors: [
                "((timeSeries.home.leaguePosition || 20) > 8 && (timeSeries.home.leaguePosition || 20) < 16 && (timeSeries.away.leaguePosition || 20) > 8 && (timeSeries.away.leaguePosition || 20) < 16) ? 1 : 0",
                "match.drawOdds"
            ],
            hypothesis: "Safe mid-table teams produce more unpredictable results",
            type: "motivation_vacuum"
        },
        {
            name: "Position_Performance_Divergence", 
            factors: [
                "(timeSeries.home.leaguePosition || 20) / (preMatch.enhanced.homeImpliedProb / 5)",
                "(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)"
            ],
            hypothesis: "Teams whose position doesn't match market expectation offer value",
            type: "expectation_mismatch"
        },
        {
            name: "Late_Season_Chaos",
            factors: [
                "(fbref.week >= 30) ? (Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20))) : 0",
                "Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))"
            ],
            hypothesis: "Late season pressure creates unpredictable handicap outcomes",
            type: "endgame_pressure"
        },
        {
            name: "Form_vs_Table_Position",
            factors: [
                "(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)",
                "(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)",
                "(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)"
            ],
            hypothesis: "Position, goal difference, and current form alignment reveals true team strength",
            type: "multi_factor_validation"
        },
        {
            name: "Quality_Expectation_Gap",
            factors: [
                "Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))",
                "Math.abs(preMatch.enhanced.homeImpliedProb - preMatch.enhanced.awayImpliedProb)",
                "match.asianHandicapOdds.homeOdds / match.asianHandicapOdds.awayOdds"
            ],
            hypothesis: "Large quality gaps should align with market pricing and handicap lines",
            type: "market_efficiency_validation"
        }
    ]
};