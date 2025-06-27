// HKJC "Trapped" Strategy - Fade Quarter Handicaps with Extreme Odds
// Theory: HKJC gets trapped into extreme odds on quarter handicaps due to inability to offer pure half handicaps
// Strategy: Bet against the heavy favorite when HKJC offers extreme odds on quarter handicaps

module.exports = {
    name: "HKJC Trapped Strategy",
    description: "Exploit HKJC's structural inability to offer half handicaps, creating trapped extreme odds situations",
    enabled: true,
    factors: [
        // === CORE TRAPPED STRATEGY ===
        // Identify quarter handicaps with extreme odds and fade the favorite
        
        {
            name: "trappedQuarterExtreme",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && (match.asianHandicapOdds.homeOdds <= 1.7 || match.asianHandicapOdds.awayOdds <= 1.7)) ? 1 : 0",
            description: "Quarter handicap with extreme odds - HKJC trapped by public betting",
            betSide: "conditional" // Will determine which side based on odds
        },
        
        // === SPECIFIC TRAPPED SCENARIOS ===
        
        {
            name: "trappedFadeHomeExtreme",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && match.asianHandicapOdds.homeOdds <= 1.7) ? 1 : 0",
            description: "Fade home team when trapped with extreme low odds on quarter handicap",
            betSide: "away"
        },
        {
            name: "trappedFadeAwayExtreme", 
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && match.asianHandicapOdds.awayOdds <= 1.7) ? 1 : 0",
            description: "Fade away team when trapped with extreme low odds on quarter handicap",
            betSide: "home"
        },
        
        // === EARLY SEASON TRAPPED (HIGHEST EDGE) ===
        
        {
            name: "earlySeasonTrappedHome",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap.includes('/') && match.asianHandicapOdds.homeOdds <= 1.7) ? 1 : 0",
            description: "Early season trapped home favorites - maximum inefficiency",
            betSide: "away"
        },
        {
            name: "earlySeasonTrappedAway",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap.includes('/') && match.asianHandicapOdds.awayOdds <= 1.7) ? 1 : 0",
            description: "Early season trapped away favorites - maximum inefficiency", 
            betSide: "home"
        },
        
        // === VERY EXTREME TRAPPED (ULTRA CONFIDENT HKJC) ===
        
        {
            name: "ultraTrappedFadeHome",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && match.asianHandicapOdds.homeOdds <= 1.65) ? 1 : 0",
            description: "Ultra trapped home favorites (<=1.65 odds) - HKJC very confident but wrong",
            betSide: "away"
        },
        {
            name: "ultraTrappedFadeAway",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && match.asianHandicapOdds.awayOdds <= 1.65) ? 1 : 0",
            description: "Ultra trapped away favorites (<=1.65 odds) - HKJC very confident but wrong",
            betSide: "home"
        },
        
        // === SPECIFIC QUARTER HANDICAP TRAPS ===
        
        {
            name: "trappedZeroHalf",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5' && (match.asianHandicapOdds.homeOdds <= 1.7 || match.asianHandicapOdds.awayOdds <= 1.7)) ? 1 : 0",
            description: "Trapped 0/-0.5 handicap with extreme odds - pick'em gone wrong",
            betSide: "conditional"
        },
        {
            name: "trappedHalfOne",
            expression: "(match.asianHandicapOdds.homeHandicap === '-0.5/-1' && (match.asianHandicapOdds.homeOdds <= 1.7 || match.asianHandicapOdds.awayOdds <= 1.7)) ? 1 : 0",
            description: "Trapped -0.5/-1 handicap with extreme odds - favorite overvalued",
            betSide: "conditional"
        },
        {
            name: "trappedPlusHalfOne",
            expression: "(match.asianHandicapOdds.homeHandicap === '+0.5/+1' && (match.asianHandicapOdds.homeOdds <= 1.7 || match.asianHandicapOdds.awayOdds <= 1.7)) ? 1 : 0",
            description: "Trapped +0.5/+1 handicap with extreme odds - underdog overvalued",
            betSide: "conditional"
        },
        
        // === HIGH EDGE COMBINATIONS ===
        
        {
            name: "trappedEarlySeasonZeroHalf",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && match.asianHandicapOdds.homeOdds <= 1.7) ? 1 : 0",
            description: "Early season trapped 0/-0.5 home favorites - classic scenario",
            betSide: "away"
        },
        {
            name: "trappedMidSeasonExtreme",
            expression: "(fbref.week >= 9 && fbref.week <= 20 && match.asianHandicapOdds.homeHandicap.includes('/') && (match.asianHandicapOdds.homeOdds <= 1.65 || match.asianHandicapOdds.awayOdds <= 1.65)) ? 1 : 0",
            description: "Mid season ultra trapped scenarios - HKJC very wrong when very confident",
            betSide: "conditional"
        },
        
        // === BROADER TRAPPED PATTERNS ===
        
        {
            name: "allSeasonTrapped",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && (Math.min(match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds) <= 1.7)) ? 1 : 0",
            description: "All season trapped quarter handicaps - systematic HKJC inefficiency",
            betSide: "conditional"
        },
        {
            name: "trappedWithOddsGap",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) >= 0.6) ? 1 : 0",
            description: "Quarter handicaps with large odds gaps - trapped public betting scenarios",
            betSide: "conditional"
        },
        
        // === CONTROL STRATEGIES (TEST AGAINST) ===
        
        {
            name: "simpleHandicapExtreme",
            expression: "(!match.asianHandicapOdds.homeHandicap.includes('/') && (match.asianHandicapOdds.homeOdds <= 1.7 || match.asianHandicapOdds.awayOdds <= 1.7)) ? 1 : 0",
            description: "CONTROL: Simple handicaps with extreme odds - should perform worse than trapped quarters",
            betSide: "conditional"
        },
        {
            name: "quarterHandicapNormal",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') && (match.asianHandicapOdds.homeOdds >= 1.8 && match.asianHandicapOdds.awayOdds >= 1.8)) ? 1 : 0",
            description: "CONTROL: Quarter handicaps with normal odds - should perform worse than trapped",
            betSide: "conditional"
        }
    ]
}; 