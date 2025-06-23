// Clean Asian Handicap Only Factors
// This file contains ONLY factors that are compatible with Asian Handicap betting
// NO 1X2 factors allowed (homeWinOdds, awayWinOdds, drawOdds, implied probabilities)

module.exports = {
    name: "Clean Asian Handicap Factors",
    description: "Only factors compatible with Asian Handicap betting - no 1X2 contamination",
    enabled: true,
    factors: [
        // Asian Handicap Odds (SAFE)
        {
            name: "ahHomeOdds",
            expression: "match.asianHandicapOdds.homeOdds",
            description: "Asian Handicap home odds"
        },
        {
            name: "ahAwayOdds", 
            expression: "match.asianHandicapOdds.awayOdds",
            description: "Asian Handicap away odds"
        },
        {
            name: "handicapLine",
            expression: "match.asianHandicapOdds.homeHandicap",
            description: "Asian Handicap line"
        },
        
        // League Position Factors (SAFE)
        {
            name: "homePosition",
            expression: "timeSeries.home.leaguePosition || 20",
            description: "Home team league position"
        },
        {
            name: "awayPosition", 
            expression: "timeSeries.away.leaguePosition || 20",
            description: "Away team league position"
        },
        {
            name: "positionGap",
            expression: "(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)",
            description: "Position gap (away - home)"
        },
        
        // Goal Difference Factors (SAFE)
        {
            name: "homeGoalDiff",
            expression: "timeSeries.home.cumulative.overall.goalDifference || 0",
            description: "Home team goal difference"
        },
        {
            name: "awayGoalDiff",
            expression: "timeSeries.away.cumulative.overall.goalDifference || 0", 
            description: "Away team goal difference"
        },
        
        // Streak Factors (SAFE - using current streaks, not win/lose specific)
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
        
        // Time/Season Factors (SAFE)
        {
            name: "weekInSeason",
            expression: "fbref.week || 1",
            description: "Week number in season"
        },
        {
            name: "attendance",
            expression: "match.attendance || 0",
            description: "Match attendance"
        },
        
        // Asian Handicap Performance (SAFE)
        {
            name: "homeAHWinRate",
            expression: "timeSeries.home.cumulative.markets.asianHandicapWinRate || 0",
            description: "Home team Asian Handicap win rate"
        },
        {
            name: "awayAHWinRate",
            expression: "timeSeries.away.cumulative.markets.asianHandicapWinRate || 0",
            description: "Away team Asian Handicap win rate"
        }
    ],
    
    // PROHIBITED FACTORS - DO NOT USE
    prohibitedFactors: [
        "homeWinOdds",
        "awayWinOdds", 
        "drawOdds",
        "homeImpliedProb",
        "awayImpliedProb",
        "drawImpliedProb",
        "homeScore",
        "awayScore",
        "homeGoals",
        "awayGoals",
        "winRate", // Unless specifically Asian Handicap win rate
        "lossRate",
        "drawRate"
    ],
    
    combinations: [
        {
            name: "AH_Odds_Ratio",
            factors: ["match.asianHandicapOdds.homeOdds / match.asianHandicapOdds.awayOdds"],
            hypothesis: "Asian Handicap odds ratio indicates market sentiment",
            type: "asian_handicap"
        },
        {
            name: "Position_vs_AH_Performance",
            factors: ["(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)", "timeSeries.home.cumulative.markets.asianHandicapWinRate || 0"],
            hypothesis: "Position gap combined with AH performance reveals value",
            type: "asian_handicap"
        }
    ]
}; 