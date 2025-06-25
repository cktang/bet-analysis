// Fade Early Season Home Favorites - Bet Away Teams
// Based on discovery that early season home teams with 0/-0.5 lose badly
// Strategy: Bet AWAY teams when they get +0/+0.5 handicap in early season uncertainty

module.exports = {
    name: "Fade Early Season Home Favorites",
    description: "Bet away teams getting positive handicaps when home teams are slight favorites in early season uncertainty",
    enabled: true,
    factors: [
        // === CORE FADE STRATEGIES ===
        // Bet away team when home has 0/-0.5 (away gets +0/+0.5)
        
        {
            name: "fadeEarlySeasonQuarterFavorites",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Fade early season quarter favorites - bet AWAY team getting +0/+0.5",
            betSide: "away"
        },
        {
            name: "fadeVeryEarlyQuarterFavorites", 
            expression: "(fbref.week <= 4 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Fade very early season quarter favorites - bet AWAY team in maximum uncertainty",
            betSide: "away"
        },
        {
            name: "fadeEarlyQuarterWithGoodAwayOdds",
            expression: "(fbref.week <= 6 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && match.asianHandicapOdds.awayOdds >= 1.85) ? 1 : 0",
            description: "Fade early quarter favorites when away odds are decent - value underdogs",
            betSide: "away"
        },
        {
            name: "fadeEarlyQuarterBalancedOdds",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.1) ? 1 : 0",
            description: "Fade early quarter favorites with balanced odds - true toss-up favors away",
            betSide: "away"
        },
        {
            name: "fadeEarlyQuarterAwayTopSix",
            expression: "(fbref.week <= 10 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Fade early quarter favorites when away team is top 6 - quality undervalued",
            betSide: "away"
        },
        {
            name: "fadeEarlyQuarterWeakHome",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.home.leaguePosition || 20) >= 15) ? 1 : 0",
            description: "Fade weak home teams as early quarter favorites - market overconfidence",
            betSide: "away"
        },
        
        // === BROADER FADE STRATEGIES ===
        // Test fading different handicap types and timeframes
        
        {
            name: "fadeEarlyStrongerHomeFavorites",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1') ? 1 : 0",
            description: "Fade stronger early season home favorites - bet away +0.5/+1",
            betSide: "away"
        },
        {
            name: "fadeAllEarlySplitFavorites",
            expression: "(fbref.week <= 8 && (match.asianHandicapOdds.homeHandicap === '0/-0.5' || match.asianHandicapOdds.homeHandicap === '-0.5/-1')) ? 1 : 0", 
            description: "Fade all early season split handicap favorites - comprehensive away strategy",
            betSide: "away"
        },
        {
            name: "fadeAllSeasonQuarterFavorites",
            expression: "(match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Fade quarter favorites all season - test if pattern continues year-round",
            betSide: "away"
        },
        {
            name: "fadeMidSeasonQuarterFavorites",
            expression: "(fbref.week >= 9 && fbref.week <= 20 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Fade mid season quarter favorites - test if bias continues",
            betSide: "away"
        },
        {
            name: "fadeLateSeasonQuarterFavorites",
            expression: "(fbref.week >= 30 && match.asianHandicapOdds.homeHandicap === '0/-0.5') ? 1 : 0",
            description: "Fade late season quarter favorites - pressure favors underdogs",
            betSide: "away"
        },
        
        // === SPECIFIC SCENARIO FADES ===
        // Target specific situations where fade should work best
        
        {
            name: "fadeEarlyQuarterDecentAwayTeams",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && (timeSeries.away.leaguePosition || 20) <= 10) ? 1 : 0",
            description: "Fade early quarter favorites when away team is decent (top 10) - quality gets undervalued",
            betSide: "away"
        },
        {
            name: "fadeEarlyQuarterGoodAwayOdds",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '0/-0.5' && match.asianHandicapOdds.awayOdds >= 1.9 && match.asianHandicapOdds.awayOdds <= 2.1) ? 1 : 0",
            description: "Fade early quarter favorites with optimal away odds range - sweet spot value",
            betSide: "away"
        }
    ]
}; 