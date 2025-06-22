// INVALID: Post-match performance factors (DISABLED - uses match results)
// These factors use actual match outcomes and should NOT be used for prediction

module.exports = {
    name: "Performance Factors (INVALID)",
    description: "❌ DISABLED: These factors use match results - invalid for prediction",
    enabled: false,
    warning: "These factors contain match outcome data and create unrealistic results",
    factors: [
        {
            name: "homeEfficiency",
            expression: "enhanced.performance.homeEfficiency",
            description: "❌ INVALID: Home team goal efficiency (uses actual goals)",
            invalid: true,
            reason: "Uses actual match result"
        },
        {
            name: "awayEfficiency",
            expression: "enhanced.performance.awayEfficiency", 
            description: "❌ INVALID: Away team goal efficiency (uses actual goals)",
            invalid: true,
            reason: "Uses actual match result"
        },
        {
            name: "homeXGDiff",
            expression: "enhanced.performance.homeXGDiff",
            description: "❌ INVALID: Home XG vs actual difference (uses actual goals)",
            invalid: true,
            reason: "Uses actual match result"
        },
        {
            name: "awayXGDiff", 
            expression: "enhanced.performance.awayXGDiff",
            description: "❌ INVALID: Away XG vs actual difference (uses actual goals)",
            invalid: true,
            reason: "Uses actual match result"
        }
    ],
    combinations: []
};