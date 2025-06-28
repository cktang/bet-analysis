// Contextual and situational factors (pre-match only)

module.exports = {
    name: "Contextual Factors",
    description: "Match context and situational variables available before kickoff",
    enabled: true,
    factors: [
        {
            name: "weekInSeason",
            expression: "fbref.week",
            description: "Week number in the season (fatigue/form effects)"
        },
        {
            name: "attendance",
            expression: "fbref.attendance",
            description: "Stadium attendance (home advantage indicator)"
        },
        {
            name: "handicapLine",
            expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])",
            description: "Asian Handicap line value"
        }
    ],
    combinations: [
        {
            name: "Season_Fatigue",
            factors: ["fbref.week"],
            hypothesis: "Late season matches have different patterns due to fatigue",
            type: "single"
        },
        {
            name: "Home_Advantage",
            factors: ["fbref.attendance", "preMatch.enhanced.homeImpliedProb"],
            hypothesis: "Higher attendance correlates with stronger home advantage",
            type: "contextual"
        },
        // DISABLED: XG data contains hindsight bias
        // {
        //     name: "Handicap_vs_XG",
        //     factors: ["parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])", "fbref.homeXG - fbref.awayXG"],
        //     hypothesis: "Handicap line vs XG difference shows market accuracy",
        //     type: "validation"
        // }
    ]
};