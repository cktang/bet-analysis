// AH Value Hunting - Simple but Profitable Strategies
// Focus on HKJC-style quarter handicaps and market inefficiencies
// Based on observation that simple rules outperform complex ones

module.exports = {
    name: "AH Value Hunting",
    description: "Simple Asian Handicap value strategies focusing on market inefficiencies and HKJC-style quarter handicaps",
    enabled: true,
    factors: [
        // === PURE AH LINE BETTING ===
        // Test each AH range to find systematic biases
        
        {
            name: "ahPickEm",
            expression: "Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.25 ? 1 : 0",
            description: "Pick'em games (AH -0.25 to +0.25) - closest matches"
        },
        {
            name: "ahSlightFavorite", 
            expression: "(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.75 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.25) ? 1 : 0",
            description: "Home slight favorite (AH -0.25 to -0.75)"
        },
        {
            name: "ahMediumFavorite",
            expression: "(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -1.25 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.75) ? 1 : 0", 
            description: "Home medium favorite (AH -0.75 to -1.25)"
        },
        {
            name: "ahHeavyFavorite",
            expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -1.5 ? 1 : 0",
            description: "Home heavy favorite (AH -1.5 or more)"
        },
        {
            name: "ahAwayFavorite",
            expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 0.25 ? 1 : 0",
            description: "Away team favorite (positive AH for home)"
        },
        
        // === HKJC QUARTER HANDICAP FOCUS ===
        // HKJC doesn't offer -0.5, -1.5 etc - focus on quarters
        
        {
            name: "ahQuarterHandicap",
            expression: "(match.asianHandicapOdds.homeHandicap.includes('/') || match.asianHandicapOdds.homeHandicap.includes('.25') || match.asianHandicapOdds.homeHandicap.includes('.75')) ? 1 : 0",
            description: "Quarter handicaps (-0.25, -0.75, etc) - HKJC style"
        },
        {
            name: "ahNoHalfHandicap", 
            expression: "(!match.asianHandicapOdds.homeHandicap.includes('.5') && !match.asianHandicapOdds.homeHandicap.includes('/')) ? 1 : 0",
            description: "Whole number handicaps only (0, -1, -2) - avoid halves"
        },
        {
            name: "ahExactQuarter",
            expression: "(match.asianHandicapOdds.homeHandicap === '-0.25' || match.asianHandicapOdds.homeHandicap === '-0.75' || match.asianHandicapOdds.homeHandicap === '-1.25') ? 1 : 0",
            description: "Exact quarter handicaps where HKJC has edge"
        },
        
        // === AH vs 1X2 MISMATCH HUNTING ===
        // Look for discrepancies between AH and 1X2 markets
        
        {
            name: "ahHomeOddsVs1X2",
            expression: "(match.asianHandicapOdds.homeOdds / match.homeWinOdds)",
            description: "Ratio of AH home odds to 1X2 home odds - value when >1.1"
        },
        {
            name: "ahAwayOddsVs1X2", 
            expression: "(match.asianHandicapOdds.awayOdds / match.awayWinOdds)",
            description: "Ratio of AH away odds to 1X2 away odds - value when >1.1"
        },
        {
            name: "ahImpliedVsActual",
            expression: "((1/match.asianHandicapOdds.homeOdds + 1/match.asianHandicapOdds.awayOdds) - (1/match.homeWinOdds + 1/match.awayWinOdds + 1/match.drawOdds))",
            description: "AH market efficiency vs 1X2 - negative means AH offers better value"
        },
        
        // === SEASONAL TIMING + AH VALUE ===
        // Combine simple timing with AH ranges
        
        {
            name: "earlySeasonPickEm",
            expression: "(fbref.week <= 10 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.25) ? 1 : 0",
            description: "Early season close games - market uncertainty"
        },
        {
            name: "lateSeasonHeavyFavorites",
            expression: "(fbref.week >= 30 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -1.5) ? 1 : 0", 
            description: "Late season heavy favorites - desperation/pressure"
        },
        {
            name: "midSeasonPickEm",
            expression: "(fbref.week >= 15 && fbref.week <= 25 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.25) ? 1 : 0",
            description: "Mid-season close games - form established"
        },
        {
            name: "christmasFixtures",
            expression: "(fbref.week >= 17 && fbref.week <= 21 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.75) ? 1 : 0",
            description: "Christmas period close games - fatigue factor"
        },
        
        // === POSITION + AH VALUE COMBINATIONS ===
        // Simple league position filters with AH ranges
        
        {
            name: "topSixPickEm", 
            expression: "((timeSeries.home.leaguePosition || 20) <= 6 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.25) ? 1 : 0",
            description: "Top 6 home team in close game - quality shows"
        },
        {
            name: "bottomSixFavorite",
            expression: "((timeSeries.home.leaguePosition || 20) >= 15 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5) ? 1 : 0",
            description: "Bottom 6 team as favorite - market overconfidence"
        },
        {
            name: "awayTopSixUnderdog",
            expression: "((timeSeries.away.leaguePosition || 20) <= 6 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.75) ? 1 : 0",
            description: "Away top 6 team as underdog - value opportunity" 
        },
        {
            name: "relegationBattlePickEm",
            expression: "((timeSeries.home.leaguePosition || 20) >= 15 && (timeSeries.away.leaguePosition || 20) >= 15 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.25) ? 1 : 0",
            description: "Relegation battle close games - desperation factor"
        },
        
        // === SIMPLE VALUE BETS ===
        // Always bet one side when certain conditions met
        
        {
            name: "alwaysBetAwayWhenHomeHeavyFav",
            expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -2.0 ? 1 : 0",
            description: "Always bet away when home is huge favorite - fade the chalk"
        },
        {
            name: "alwaysBetHomeInPickEm",
            expression: "(Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.25 && match.asianHandicapOdds.homeOdds <= 1.95) ? 1 : 0",
            description: "Always bet home in close games with good odds - home advantage"
        },
        {
            name: "alwaysBetAwayTopSix", 
            expression: "((timeSeries.away.leaguePosition || 20) <= 6 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.5) ? 1 : 0",
            description: "Always bet away top 6 when not big underdog - quality travels"
        },
        
        // === EARLY SEASON AH -0.25 SPECIALISTS ===
        // Targeting market uncertainty in opening weeks with quarter handicaps
        
        {
            name: "earlySeasonQuarterFavorite",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Early season 0/-0.5 handicap - market uncertainty with quarter handicap favorites"
        },
        {
            name: "earlySeasonQuarterHomeAdvantage", 
            expression: "(fbref.week <= 6 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && match.asianHandicapOdds.homeOdds >= 1.85) ? 1 : 0",
            description: "Early season 0/-0.5 with decent home odds - home advantage in uncertainty"
        },
        {
            name: "earlySeasonQuarterTopSix",
            expression: "(fbref.week <= 10 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Early season 0/-0.5 with top 6 home team - quality emerges early"
        },
        {
            name: "earlySeasonQuarterAwayValue",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.away.leaguePosition || 20) <= 10) ? 1 : 0",
            description: "Early season 0/-0.5 backing away team when decent - undervalued quality"
        },
        {
            name: "earlySeasonQuarterBalanced",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.1) ? 1 : 0",
            description: "Early season 0/-0.5 with balanced odds - true pick'em scenarios"
        },
        {
            name: "veryEarlyQuarterHome",
            expression: "(fbref.week <= 4 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Very early season (first 4 weeks) 0/-0.5 home favorite - maximum uncertainty"
        },
        {
            name: "earlySeasonQuarterNewPromotion",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.home.leaguePosition || 20) >= 15) ? 1 : 0",
            description: "Early season 0/-0.5 with lower table home team - market overconfidence"
        },
        {
            name: "earlySeasonQuarterExactOdds",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && match.asianHandicapOdds.homeOdds >= 1.9 && match.asianHandicapOdds.homeOdds <= 2.0) ? 1 : 0",
            description: "Early season 0/-0.5 with specific odds range - optimal value zone"
        },
        
        // === BROADER EARLY SEASON RULES ===
        // These should definitely catch matches
        
        {
            name: "earlySeasonAnyQuarter",
            expression: "(fbref.week <= 8 && (match.asianHandicapOdds.homeHandicap === '0/-0.5' || match.asianHandicapOdds.homeHandicap === '-0.5/-1' || match.asianHandicapOdds.homeHandicap === '0/+0.5' || match.asianHandicapOdds.homeHandicap === '+0.5/+1')) ? 1 : 0",
            description: "Early season ANY HKJC split handicap - market uncertainty with quarter lines"
        },
        {
            name: "earlySeasonSplitFavorites",
            expression: "(fbref.week <= 8 && (match.asianHandicapOdds.homeHandicap === '0/-0.5' || match.asianHandicapOdds.homeHandicap === '-0.5/-1')) ? 1 : 0",
            description: "Early season split handicap favorites (0/-0.5, -0.5/-1) - HKJC quarter favorites"
        },
        {
            name: "earlySeasonSplitUnderdogs",
            expression: "(fbref.week <= 8 && (match.asianHandicapOdds.homeHandicap === '0/+0.5' || match.asianHandicapOdds.homeHandicap === '+0.5/+1')) ? 1 : 0",
            description: "Early season split handicap underdogs (0/+0.5, +0.5/+1) - HKJC quarter underdogs"
        },
        
        // === MORE OPPOSITE SIDE STRATEGIES ===
        // Fade early season split handicap favorites across all HKJC lines
        
        {
            name: "earlySeasonFadeAllSplitFavorites",
            expression: "(fbref.week <= 8 && (match.asianHandicapOdds.homeHandicap === '0/-0.5' || match.asianHandicapOdds.homeHandicap === '-0.5/-1')) ? -1 : 0",
            description: "Early season fade ALL split handicap favorites - away team value across HKJC lines"
        },
        {
            name: "earlySeasonFadeStrongHomeFavorites",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1') ? -1 : 0",
            description: "Early season fade stronger home favorites (-0.5/-1) - away team +0.5/+1 value"
        },
        {
            name: "midSeasonFadeQuarterFavorites",
            expression: "(fbref.week >= 9 && fbref.week <= 20 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? -1 : 0",
            description: "Mid season fade quarter favorites - test if bias continues beyond early weeks"
        },
        {
            name: "lateSeasonFadeQuarterFavorites",
            expression: "(fbref.week >= 30 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? -1 : 0",
            description: "Late season fade quarter favorites - pressure situations favor underdogs"
        },
        {
            name: "allSeasonZeroHalf",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "All season 0/-0.5 handicap - classic HKJC quarter favorite across all weeks"
        },
        
        // === OPPOSITE SIDE STRATEGIES ===
        // Betting AWAY team when home has 0/-0.5 (so away gets +0/+0.5)
        
        {
            name: "earlySeasonQuarterUnderdog",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? -1 : 0",
            description: "Early season AWAY team +0/+0.5 handicap - fade home favorites in uncertainty"
        },
        {
            name: "veryEarlyQuarterAway",
            expression: "(fbref.week <= 4 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? -1 : 0",
            description: "Very early season (first 4 weeks) AWAY team +0/+0.5 - maximum uncertainty fade"
        },
        {
            name: "earlySeasonQuarterAwayAdvantage",
            expression: "(fbref.week <= 6 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && match.asianHandicapOdds.awayOdds >= 1.85) ? -1 : 0",
            description: "Early season AWAY team +0/+0.5 with decent away odds - value underdogs"
        },
        {
            name: "earlySeasonQuarterAwayTopSix",
            expression: "(fbref.week <= 10 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.away.leaguePosition || 20) <= 6) ? -1 : 0",
            description: "Early season AWAY team +0/+0.5 with top 6 away team - quality gets undervalued"
        },
        {
            name: "earlySeasonQuarterAwayBalanced",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.1) ? -1 : 0",
            description: "Early season AWAY team +0/+0.5 with balanced odds - true toss-up scenarios"
        },
        {
            name: "earlySeasonQuarterFadeHomeBias",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.home.leaguePosition || 20) >= 15) ? -1 : 0",
            description: "Early season fade weak home teams as quarter favorites - market overconfidence"
        },
        {
            name: "allSeasonZeroHalfAway",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5') ? -1 : 0",
            description: "All season AWAY team +0/+0.5 handicap - fade HKJC quarter favorites year-round"
        },
        {
            name: "earlySeasonSmallHome",
            expression: "(fbref.week <= 8 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.5 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.1) ? 1 : 0",
            description: "Early season small home handicap (-0.5 to -0.1) - slight favorites in uncertainty"
        },
        {
            name: "earlySeasonCloseLines",
            expression: "(fbref.week <= 8 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.5) ? 1 : 0",
            description: "Early season close lines (within 0.5) - maximum market uncertainty"
        },
        {
            name: "veryEarlySeasonAll",
            expression: "(fbref.week <= 4) ? 1 : 0",
            description: "Very early season (first 4 weeks) - ALL games during maximum uncertainty"
        },
        
        // === ODDS EFFICIENCY PATTERNS ===
        // Look for systematic biases in AH odds
        
        {
            name: "ahHighJuice",
            expression: "((1/match.asianHandicapOdds.homeOdds + 1/match.asianHandicapOdds.awayOdds) > 1.08) ? 1 : 0",
            description: "High juice AH markets (>8% margin) - bookmaker confident"
        },
        {
            name: "ahLowJuice", 
            expression: "((1/match.asianHandicapOdds.homeOdds + 1/match.asianHandicapOdds.awayOdds) < 1.04) ? 1 : 0",
            description: "Low juice AH markets (<4% margin) - competitive pricing"
        },
        {
            name: "ahRoundNumberBias",
            expression: "(match.asianHandicapOdds.homeOdds === 2.0 || match.asianHandicapOdds.awayOdds === 2.0 || match.asianHandicapOdds.homeOdds === 1.9 || match.asianHandicapOdds.awayOdds === 1.9) ? 1 : 0",
            description: "Round number odds (1.9, 2.0) - psychological anchoring"
        }
    ]
}; 