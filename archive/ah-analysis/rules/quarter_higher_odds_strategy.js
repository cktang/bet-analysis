// Quarter Handicap Higher Odds Strategy
// Rule: Bet quarter handicaps, always take higher odds side, use $200 + $150 increment staking

module.exports = {
    name: "Quarter Handicap Higher Odds Strategy",
    description: "Bet quarter handicaps always taking the higher odds side with variable staking",
    enabled: true,
    factors: [
        // === CORE HIGHER ODDS STRATEGY ===
        
        {
            name: "quarterHigherOddsCore",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 1.91) ? 1 : 0",
            description: "CORE: Quarter handicaps betting higher odds side (≥1.91 odds only)",
            betSide: "higherOdds" // Special directive to bet the higher odds side
        },
        
        // === REFINED VERSIONS ===
        
        {
            name: "quarterHigherOddsOptimal",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 2.00) ? 1 : 0",
            description: "Optimal: Quarter handicaps higher odds ≥2.00 only (skip marginal bets)",
            betSide: "higherOdds"
        },
        
        {
            name: "quarterHigherOddsConservative",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 2.10) ? 1 : 0",
            description: "Conservative: Quarter handicaps higher odds ≥2.10 only (best ROI range)",
            betSide: "higherOdds"
        },
        
        // === EARLY SEASON ENHANCED ===
        
        {
            name: "quarterHigherOddsEarlySeason",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap.includes('/') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 1.91) ? 1 : 0",
            description: "Early season quarter handicaps higher odds (maximum market inefficiency)",
            betSide: "higherOdds"
        },
        
        // === SPECIFIC QUARTER TYPES ===
        
        {
            name: "quarterHigherOddsPickEm",
            expression: "((match.asianHandicapOdds.homeHandicap === '0/-0.5' || match.asianHandicapOdds.homeHandicap === '0/+0.5') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 1.91) ? 1 : 0",
            description: "Pick'em quarter handicaps (0/-0.5, 0/+0.5) betting higher odds",
            betSide: "higherOdds"
        },
        
        {
            name: "quarterHigherOddsModerate",
            expression: "((match.asianHandicapOdds.homeHandicap === '-0.5/-1' || match.asianHandicapOdds.homeHandicap === '+0.5/+1') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 1.91) ? 1 : 0",
            description: "Moderate quarter handicaps (±0.5/±1) betting higher odds",
            betSide: "higherOdds"
        },
        
        // === BALANCED ODDS SCENARIOS ===
        
        {
            name: "quarterHigherOddsBalanced",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 1.91 && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.30) ? 1 : 0",
            description: "Quarter handicaps with balanced odds (≤0.30 difference) betting higher side",
            betSide: "higherOdds"
        },
        
        // === VALUE RANGE STRATEGIES ===
        
        {
            name: "quarterHigherOddsSweetSpot",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 2.00 && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= 2.30) ? 1 : 0",
            description: "Sweet spot: Quarter handicaps higher odds 2.00-2.30 range (best ROI)",
            betSide: "higherOdds"
        },
        
        // === COMPREHENSIVE STRATEGY ===
        
        {
            name: "quarterHigherOddsAll",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/')) ? Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) : 0",
            description: "All quarter handicaps weighted by higher odds value (continuous staking)",
            betSide: "higherOdds"
        },
        
        // === MINIMUM EDGE STRATEGIES ===
        
        {
            name: "quarterHigherOddsMinEdge",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) >= 1.95 && Math.max(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= 2.50) ? 1 : 0",
            description: "Minimum edge: Quarter handicaps 1.95-2.50 range (skip extreme odds)",
            betSide: "higherOdds"
        }
    ]
}; 