// Market efficiency and pricing factors (pre-match only)

module.exports = {
    name: "Market Efficiency Factors",
    description: "Market efficiency metrics and implied probabilities",
    enabled: true,
    factors: [
        {
            name: "homeImpliedProb",
            expression: "enhanced.preMatch.marketEfficiency.homeImpliedProb",
            description: "Implied probability of home win from odds"
        },
        {
            name: "drawImpliedProb",
            expression: "enhanced.preMatch.marketEfficiency.drawImpliedProb",
            description: "Implied probability of draw from odds"
        },
        {
            name: "awayImpliedProb",
            expression: "enhanced.preMatch.marketEfficiency.awayImpliedProb",
            description: "Implied probability of away win from odds"
        },
        {
            name: "totalImpliedProb",
            expression: "enhanced.preMatch.marketEfficiency.totalImpliedProb",
            description: "Total implied probability (shows overround)"
        },
        {
            name: "cutPercentage",
            expression: "enhanced.preMatch.marketEfficiency.cutPercentage",
            description: "Bookmaker margin/cut percentage"
        }
    ],
    combinations: [
        {
            name: "Market_Bias",
            factors: ["enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb"],
            hypothesis: "Market bias toward home/away indicates value opportunities",
            type: "single"
        },
        {
            name: "Overround_Analysis",
            factors: ["enhanced.preMatch.marketEfficiency.totalImpliedProb", "enhanced.preMatch.marketEfficiency.cutPercentage"],
            hypothesis: "High overround markets may have less efficient pricing",
            type: "market_analysis"
        },
        // DISABLED: XG data contains hindsight bias
        // {
        //     name: "Probability_vs_XG",
        //     factors: ["enhanced.preMatch.marketEfficiency.homeImpliedProb", "fbref.homeXG - fbref.awayXG"],
        //     hypothesis: "Market probabilities vs XG difference reveals mispricing",
        //     type: "cross_analysis"
        // }
    ]
};