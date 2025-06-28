// Expected Goals related factors (pre-match only)

module.exports = {
    name: "Expected Goals Factors",
    description: "Pre-match Expected Goals data from FBRef",
    enabled: false, // DISABLED: XG data contains hindsight bias
    factors: [
        {
            name: "homeXG",
            expression: "fbref.homeXG",
            description: "Home team expected goals"
        },
        {
            name: "awayXG", 
            expression: "fbref.awayXG",
            description: "Away team expected goals"
        },
        {
            name: "xgDifference",
            expression: "fbref.homeXG - fbref.awayXG",
            description: "XG difference (home - away)"
        },
        {
            name: "totalXG",
            expression: "fbref.homeXG + fbref.awayXG",
            description: "Total expected goals for both teams"
        }
    ],
    combinations: [
        {
            name: "XG_Difference_Simple",
            factors: ["fbref.homeXG - fbref.awayXG"],
            hypothesis: "XG difference predicts Asian Handicap outcomes",
            type: "single"
        },
        {
            name: "XG_Total_vs_Market",
            factors: ["fbref.homeXG + fbref.awayXG", "match.over2_5Odds"],
            hypothesis: "Total XG vs over/under market indicates goal market efficiency",
            type: "market_efficiency"
        }
    ]
};