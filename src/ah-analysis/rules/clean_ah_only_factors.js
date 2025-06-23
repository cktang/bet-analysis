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
        }
    ],
    
    // PROHIBITED FACTORS - DO NOT USE
    prohibitedFactors: [
        "homeWinOdds",
        "awayWinOdds", 
        "drawOdds",
        "homeImpliedProb",
        "awayImpliedProb",
        "drawImpliedProb"
    ]
};
