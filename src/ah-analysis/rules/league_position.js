// League position factors (pre-match only)

module.exports = {
    name: "League Position Factors",
    description: "Team standings and positional momentum indicators",
    enabled: true,
    factors: [
        // Basic position factors
        {
            name: "homePosition",
            expression: "timeSeries.home.leaguePosition || 20",
            description: "Home team current league position"
        },
        {
            name: "awayPosition",
            expression: "timeSeries.away.leaguePosition || 20",
            description: "Away team current league position"
        },
        
        // Position differentials and gaps
        {
            name: "positionGap",
            expression: "(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)",
            description: "League position gap (away - home, positive = home higher)"
        },
        {
            name: "positionGapAbs",
            expression: "Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))",
            description: "Absolute league position gap between teams"
        },
        
        // Position categories
        {
            name: "homeTopSix",
            expression: "(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0",
            description: "Home team in top 6 positions (European spots)"
        },
        {
            name: "awayTopSix",
            expression: "(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0",
            description: "Away team in top 6 positions (European spots)"
        },
        {
            name: "homeBottomThree",
            expression: "(timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0",
            description: "Home team in relegation zone (bottom 3)"
        },
        {
            name: "awayBottomThree",
            expression: "(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0",
            description: "Away team in relegation zone (bottom 3)"
        },
        
        // Combined position strength
        {
            name: "combinedPosition",
            expression: "(timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)",
            description: "Combined league positions (lower = better teams)"
        },
        {
            name: "averagePosition",
            expression: "((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2",
            description: "Average league position of both teams"
        }
    ],
    combinations: [
        {
            name: "Position_Gap_Analysis",
            factors: ["(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)"],
            hypothesis: "Large position gaps create predictable handicap value",
            type: "position_differential"
        },
        {
            name: "Top_vs_Bottom",
            factors: [
                "(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0",
                "(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0"
            ],
            hypothesis: "Top 6 vs bottom 3 matchups show market inefficiencies",
            type: "tier_clash"
        },
        {
            name: "Mid_Table_Chaos",
            factors: [
                "((timeSeries.home.leaguePosition || 20) > 6 && (timeSeries.home.leaguePosition || 20) < 18) ? 1 : 0",
                "((timeSeries.away.leaguePosition || 20) > 6 && (timeSeries.away.leaguePosition || 20) < 18) ? 1 : 0"
            ],
            hypothesis: "Mid-table teams have unpredictable motivation affecting handicaps",
            type: "motivation_analysis"
        },
        {
            name: "Position_vs_Form",
            factors: [
                "(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)",
                "(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)"
            ],
            hypothesis: "Position vs current form creates value when they diverge",
            type: "position_form_divergence"
        },
        {
            name: "European_Pressure",
            factors: [
                "(timeSeries.home.leaguePosition || 20) <= 6 ? 1 : 0",
                "(timeSeries.away.leaguePosition || 20) <= 6 ? 1 : 0"
            ],
            hypothesis: "European spot battles create extra motivation affecting performance",
            type: "stakes_analysis"
        },
        {
            name: "Relegation_Desperation",
            factors: [
                "(timeSeries.home.leaguePosition || 20) >= 18 ? 1 : 0",
                "(timeSeries.away.leaguePosition || 20) >= 18 ? 1 : 0"
            ],
            hypothesis: "Relegation battles create desperate performance affecting handicaps",
            type: "survival_motivation"
        },
        {
            name: "Position_Quality_Mismatch",
            factors: [
                "Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20))",
                "enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb"
            ],
            hypothesis: "Large position gaps vs market odds reveal mispricing",
            type: "quality_vs_market"
        },
        {
            name: "Combined_Position_Strength",
            factors: ["((timeSeries.home.leaguePosition || 20) + (timeSeries.away.leaguePosition || 20)) / 2"],
            hypothesis: "Average team quality affects match competitiveness and handicap accuracy",
            type: "match_quality"
        },
        {
            name: "Position_vs_Goal_Difference",
            factors: [
                "(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)",
                "(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)"
            ],
            hypothesis: "League position vs goal difference reveals over/underperforming teams",
            type: "performance_vs_position"
        },
        {
            name: "Position_Momentum_Clash",
            factors: [
                "timeSeries.home.leaguePosition || 20",
                "timeSeries.away.leaguePosition || 20",
                "fbref.week"
            ],
            hypothesis: "Position battles intensify at different season stages",
            type: "seasonal_position_pressure"
        }
    ]
};