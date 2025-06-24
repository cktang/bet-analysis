// Form and streak factors (pre-match only)

module.exports = {
    name: "Form and Streak Factors",
    description: "Team form, streaks, and momentum indicators",
    enabled: true,
    factors: [
        // Overall form streaks
        {
            name: "homeCurrentStreak",
            expression: "timeSeries.home.streaks.overall.current.count || 0",
            description: "Home team current streak length"
        },
        {
            name: "awayCurrentStreak", 
            expression: "timeSeries.away.streaks.overall.current.count || 0",
            description: "Away team current streak length"
        },
        {
            name: "homeWinStreak",
            expression: "timeSeries.home.streaks.overall.longest.win || 0",
            description: "Home team longest win streak this season"
        },
        {
            name: "awayWinStreak",
            expression: "timeSeries.away.streaks.overall.longest.win || 0", 
            description: "Away team longest win streak this season"
        },
        {
            name: "homeLossStreak",
            expression: "timeSeries.home.streaks.overall.longest.loss || 0",
            description: "Home team longest loss streak this season"
        },
        {
            name: "awayLossStreak",
            expression: "timeSeries.away.streaks.overall.longest.loss || 0",
            description: "Away team longest loss streak this season"
        },
        
        // Asian Handicap specific streaks
        {
            name: "homeAHStreak",
            expression: "timeSeries.home.streaks.asianHandicap.current.count || 0",
            description: "Home team current Asian Handicap streak"
        },
        {
            name: "awayAHStreak",
            expression: "timeSeries.away.streaks.asianHandicap.current.count || 0",
            description: "Away team current Asian Handicap streak"
        },
        {
            name: "homeAHWinRate",
            expression: "timeSeries.home.patterns.asianHandicapSuccess || 0",
            description: "Home team Asian Handicap success rate this season"
        },
        {
            name: "awayAHWinRate",
            expression: "timeSeries.away.patterns.asianHandicapSuccess || 0",
            description: "Away team Asian Handicap success rate this season"
        },
        
        // Goal patterns and trends
        {
            name: "homeGoalDiff",
            expression: "timeSeries.home.cumulative.overall.goalDifference || 0",
            description: "Home team cumulative goal difference"
        },
        {
            name: "awayGoalDiff", 
            expression: "timeSeries.away.cumulative.overall.goalDifference || 0",
            description: "Away team cumulative goal difference"
        },
        {
            name: "homeOverRate",
            expression: "timeSeries.home.patterns.overRate || 0",
            description: "Home team over 2.5 goals rate"
        },
        {
            name: "awayOverRate",
            expression: "timeSeries.away.patterns.overRate || 0", 
            description: "Away team over 2.5 goals rate"
        },
        
        // Experience and fatigue
        {
            name: "homeMatchesPlayed",
            expression: "timeSeries.home.matchesPlayed || 0",
            description: "Home team matches played this season"
        },
        {
            name: "awayMatchesPlayed",
            expression: "timeSeries.away.matchesPlayed || 0",
            description: "Away team matches played this season"
        }
    ],
    combinations: [
        {
            name: "Streak_Momentum",
            factors: ["timeSeries.home.streaks.overall.current.count || 0", "timeSeries.away.streaks.overall.current.count || 0"],
            hypothesis: "Current form streaks predict Asian Handicap outcomes",
            type: "momentum"
        },
        {
            name: "AH_Form_History",
            factors: ["timeSeries.home.cumulative.markets.asianHandicapWinRate || 0", "timeSeries.away.cumulative.markets.asianHandicapWinRate || 0"],
            hypothesis: "Team-specific Asian Handicap success rates predict future AH outcomes",
            type: "form_analysis"
        },
        {
            name: "Goal_Difference_Momentum",
            factors: ["timeSeries.home.cumulative.overall.goalDifference || 0", "timeSeries.away.cumulative.overall.goalDifference || 0"],
            hypothesis: "Season goal difference momentum affects handicap performance",
            type: "performance_trend"
        },
        {
            name: "Over_Under_Patterns",
            factors: ["timeSeries.home.cumulative.markets.overRate || 0", "timeSeries.away.cumulative.markets.overRate || 0"],
            hypothesis: "Goal-scoring patterns correlate with Asian Handicap margins",
            type: "scoring_pattern"
        },
        {
            name: "Experience_vs_Freshness",
            factors: ["timeSeries.home.matchesPlayed || 0", "timeSeries.away.matchesPlayed || 0"],
            hypothesis: "Experience difference affects competitive balance",
            type: "squad_management"
        },
        {
            name: "Streak_Length_Disparity",
            factors: ["Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))"],
            hypothesis: "Large differences in current streak lengths indicate value opportunities",
            type: "momentum_contrast"
        },
        {
            name: "AH_Streak_Analysis", 
            factors: ["timeSeries.home.streaks.asianHandicap.current.count || 0", "timeSeries.away.streaks.asianHandicap.current.count || 0"],
            hypothesis: "Asian Handicap specific streaks predict continuation patterns",
            type: "market_specific"
        }
    ]
};