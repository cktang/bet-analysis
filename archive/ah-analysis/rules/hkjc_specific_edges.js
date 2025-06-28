// HKJC Specific Edges - Ultra Simple Strategies
// Based on HKJC's unique handicap offerings and current profitable patterns
// Focus: Quarter handicaps, avoiding half-odds, market timing

module.exports = {
    name: "HKJC Specific Edges", 
    description: "Ultra-simple strategies targeting HKJC's unique market structure and quarter handicap inefficiencies",
    enabled: true,
    factors: [
        // === ULTRA SIMPLE - SINGLE FACTOR BETS ===
        // Based on observation that simplest strategies work best
        
        {
            name: "justBetPickEm",
            expression: "Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.25 ? 1 : 0",
            description: "Simply bet all pick'em games - test pure home advantage"
        },
        {
            name: "justBetHeavyFavorites",
            expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -1.5 ? 1 : 0", 
            description: "Simply bet all heavy favorites - test if they're overvalued"
        },
        {
            name: "justBetUnderdogs",
            expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 0.5 ? 1 : 0",
            description: "Simply bet all underdogs - test underdog bias"
        },
        {
            name: "justBetAwayTeams",
            expression: "1", // Always 1 - will test betting away every game
            description: "Simply bet away team every game - test away value"
        },
        {
            name: "justBetHomeTeams", 
            expression: "1", // Always 1 - will test betting home every game
            description: "Simply bet home team every game - test home advantage"
        },
        
        // === HKJC QUARTER HANDICAP EDGES ===
        // HKJC specializes in quarters, avoid half-handicaps
        
        {
            name: "onlyQuarterHandicaps",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('.25') || match.asianHandicapOdds.homeHandicap.includes('.75') || match.asianHandicapOdds.homeHandicap.includes('/')) ? 1 : 0",
            description: "Only bet quarter handicaps (.25, .75) - HKJC's specialty"
        },
        {
            name: "avoidHalfHandicaps",
            expression: "(!match.asianHandicapOdds.homeHandicap.includes('.5')) ? 1 : 0",
            description: "Avoid half handicaps (.5, 1.5) - not HKJC style"
        },
        {
            name: "exactMinusQuarter",
            expression: "(match.asianHandicapOdds.homeHandicap === '-0.25') ? 1 : 0",
            description: "Only bet exact -0.25 handicap - specific line bias"
        },
        {
            name: "exactMinusThreeQuarter",
            expression: "(match.asianHandicapOdds.homeHandicap === '-0.75') ? 1 : 0",
            description: "Only bet exact -0.75 handicap - specific line bias"
        },
        {
            name: "splitHandicaps",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/')) ? 1 : 0",
            description: "Only bet split handicaps (0/-0.5, -0.5/-1) - HKJC format"
        },
        
        // === TIMING EDGES ===
        // Ultra simple timing based on profitable patterns
        
        {
            name: "onlyEarlyWeeks",
            expression: "(fbref.week <= 5) ? 1 : 0",
            description: "Only bet first 5 weeks - market uncertainty"
        },
        {
            name: "onlyLateWeeks", 
            expression: "(fbref.week >= 32) ? 1 : 0",
            description: "Only bet final 6 weeks - motivation factors"
        },
        {
            name: "onlyMidSeason",
            expression: "(fbref.week >= 15 && fbref.week <= 25) ? 1 : 0",
            description: "Only bet mid-season - form established, less pressure"
        },
        {
            name: "avoidChristmas",
            expression: "(fbref.week < 16 || fbref.week > 22) ? 1 : 0",
            description: "Avoid Christmas fixtures - unpredictable"
        },
        {
            name: "onlyBusinessEnd",
            expression: "(fbref.week >= 28) ? 1 : 0",
            description: "Only bet business end of season - high stakes"
        },
        
        // === LEAGUE POSITION EDGES ===
        // Simple position-based filters
        
        {
            name: "onlyTopSixHome",
            expression: "((timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Only bet when home team is top 6 - quality at home"
        },
        {
            name: "onlyTopSixAway",
            expression: "((timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0", 
            description: "Only bet when away team is top 6 - quality travels"
        },
        {
            name: "onlyBottomSixHome",
            expression: "((timeSeries.home.leaguePosition || 20) >= 15) ? 1 : 0",
            description: "Only bet when home team bottom 6 - desperate at home"
        },
        {
            name: "avoidMidTable",
            expression: "((timeSeries.home.leaguePosition || 20) <= 8 || (timeSeries.home.leaguePosition || 20) >= 15) ? 1 : 0",
            description: "Avoid mid-table home teams - no clear motivation"
        },
        {
            name: "bigSixClashesOnly",
            expression: "((timeSeries.home.leaguePosition || 20) <= 6 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Only bet top 6 vs top 6 - quality matchups"
        },
        
        // === AH vs 1X2 INEFFICIENCY HUNTING ===
        // Look for systematic market inefficiencies
        
        {
            name: "ahCheaperThanWin",
            expression: "(match.asianHandicapOdds.homeOdds > match.homeWinOdds) ? 1 : 0",
            description: "AH home odds better than 1X2 - market inefficiency"
        },
        {
            name: "awayCheaperInAH",
            expression: "(match.asianHandicapOdds.awayOdds > match.awayWinOdds) ? 1 : 0",
            description: "AH away odds better than 1X2 - value opportunity"
        },
        {
            name: "ahMarketTighter",
            expression: "((1/match.asianHandicapOdds.homeOdds + 1/match.asianHandicapOdds.awayOdds) < (1/match.homeWinOdds + 1/match.awayWinOdds + 1/match.drawOdds)) ? 1 : 0",
            description: "AH market has less juice than 1X2 - better value"
        },
        
        // === ANTI-PATTERNS ===
        // Bet against common patterns
        
        {
            name: "fadePublicFavorites",
            expression: "(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -1.0 && match.asianHandicapOdds.awayOdds >= 1.9) ? 1 : 0",
            description: "Fade public favorites - bet away when home big favorite"
        },
        {
            name: "backHomeUnderdogs",
            expression: "(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 0.25 && match.asianHandicapOdds.homeOdds >= 1.9) ? 1 : 0",
            description: "Back home underdogs - home advantage undervalued"
        },
        {
            name: "contrarianism",
            expression: "(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 1.0 && (timeSeries.home.leaguePosition || 20) <= 10) ? 1 : 0",
            description: "Back good teams as big underdogs - market overreaction"
        },
        
        // === ODDS PATTERN RECOGNITION ===
        // Simple odds-based patterns
        
        {
            name: "evenMoneySpots",
            expression: "(match.asianHandicapOdds.homeOdds >= 1.95 && match.asianHandicapOdds.homeOdds <= 2.05) ? 1 : 0",
            description: "Bet when home AH odds near even money - balanced market"
        },
        {
            name: "shortOddsHome",
            expression: "(match.asianHandicapOdds.homeOdds <= 1.7) ? 1 : 0",
            description: "Bet when home very short odds - fade strong favorites"
        },
        {
            name: "longOddsAway",
            expression: "(match.asianHandicapOdds.awayOdds >= 2.5) ? 1 : 0",
            description: "Bet when away long odds - contrarian value"
        },
        {
            name: "balancedOdds",
            expression: "(Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.1) ? 1 : 0",
            description: "Bet when odds very close - true pick'em games"
        },
        
        // === WEEK-SPECIFIC PATTERNS ===
        // Test specific weeks for patterns
        
        {
            name: "openingWeekend",
            expression: "(fbref.week === 1) ? 1 : 0",
            description: "Only bet opening weekend - maximum uncertainty"
        },
        {
            name: "finalDay",
            expression: "(fbref.week === 38) ? 1 : 0",
            description: "Only bet final day - known outcomes, dead rubbers"
        },
        {
            name: "newYearFixtures",
            expression: "(fbref.week >= 20 && fbref.week <= 22) ? 1 : 0",
            description: "New Year period - fatigue and fixture congestion"
        }
    ]
}; 