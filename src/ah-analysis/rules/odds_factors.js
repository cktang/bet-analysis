// Betting odds related factors (pre-match only)

module.exports = {
    name: "Betting Odds Factors",
    description: "Pre-match betting odds from multiple markets",
    enabled: true,
    factors: [
        {
            name: "homeWinOdds",
            expression: "match.homeWinOdds",
            description: "1X2 home win odds"
        },
        {
            name: "drawOdds",
            expression: "match.drawOdds", 
            description: "1X2 draw odds"
        },
        {
            name: "awayWinOdds",
            expression: "match.awayWinOdds",
            description: "1X2 away win odds"
        },
        {
            name: "over2_5Odds",
            expression: "match.over2_5Odds",
            description: "Over 2.5 goals odds"
        },
        {
            name: "under2_5Odds",
            expression: "match.under2_5Odds",
            description: "Under 2.5 goals odds"
        },
        {
            name: "ahHomeOdds",
            expression: "match.asianHandicapOdds.homeOdds",
            description: "Asian Handicap home odds"
        },
        {
            name: "ahAwayOdds",
            expression: "match.asianHandicapOdds.awayOdds",
            description: "Asian Handicap away odds"
        }
    ],
    combinations: [
        {
            name: "Win_Odds_Ratio",
            factors: ["match.homeWinOdds / match.awayWinOdds"],
            hypothesis: "Home vs away win odds ratio indicates market sentiment",
            type: "single"
        },
        {
            name: "Goals_Market_Efficiency",
            factors: ["match.over2_5Odds", "match.under2_5Odds"],
            hypothesis: "Over/under odds relationship shows market efficiency",
            type: "market_analysis"
        },
        {
            name: "AH_vs_1X2_Comparison",
            factors: ["match.asianHandicapOdds.homeOdds", "match.homeWinOdds"],
            hypothesis: "Asian Handicap vs 1X2 odds comparison reveals value",
            type: "cross_market"
        }
    ]
};