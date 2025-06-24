// Market efficiency and pricing factors (pre-match only)

module.exports = {
    name: "Market Efficiency Factors",
    description: "Market efficiency metrics and implied probabilities",
    enabled: true,
    factors: [
        {
            name: "homeImpliedProb",
            expression: "enhanced.homeImpliedProb",
            description: "Implied probability of home win from odds"
        },
        {
            name: "drawImpliedProb",
            expression: "enhanced.drawImpliedProb",
            description: "Implied probability of draw from odds"
        },
        {
            name: "awayImpliedProb",
            expression: "enhanced.awayImpliedProb",
            description: "Implied probability of away win from odds"
        },
        {
            name: "marketEfficiency",
            expression: "enhanced.marketEfficiency",
            description: "Market efficiency metric"
        },
        {
            name: "homeValueBet",
            expression: "enhanced.homeValueBet",
            description: "Home value bet indicator"
        }
    ],
    combinations: [
        {
            name: "Market_Bias",
            factors: ["enhanced.homeImpliedProb - enhanced.awayImpliedProb"],
            hypothesis: "Market bias toward home/away indicates value opportunities",
            type: "single"
        },
        {
            name: "Market_Efficiency_Analysis",
            factors: ["enhanced.marketEfficiency", "enhanced.homeValueBet"],
            hypothesis: "Market efficiency metrics reveal value opportunities",
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