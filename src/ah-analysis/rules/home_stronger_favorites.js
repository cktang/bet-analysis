// Home Stronger Favorites - Testing if stronger home favorites are undervalued in early season
// Hypothesis: While slight favorites (0/-0.5) are overvalued, stronger favorites (-0.5/-1) might be undervalued

module.exports = {
    name: "Home Stronger Favorites",
    description: "Testing if stronger home favorites (-0.5/-1) are undervalued in early season uncertainty",
    enabled: true,
    factors: [
        // === BACK STRONGER HOME FAVORITES (-0.5/-1) ===
        {
            name: "backEarlyStrongerHomeFavorites",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1') ? 1 : 0",
            description: "Back early season stronger home favorites (-0.5/-1) - they may be undervalued",
            betSide: "home"
        },
        {
            name: "backVeryEarlyStrongerHomeFavorites",
            expression: "(fbref.week <= 4 && match.asianHandicapOdds.homeHandicap === '-0.5/-1') ? 1 : 0",
            description: "Back very early stronger home favorites - maximum uncertainty with quality teams",
            betSide: "home"
        },
        {
            name: "backExtendedEarlyStrongerHomeFavorites",
            expression: "(fbref.week <= 12 && match.asianHandicapOdds.homeHandicap === '-0.5/-1') ? 1 : 0",
            description: "Back extended early stronger home favorites (weeks 1-12)",
            betSide: "home"
        },
        {
            name: "backEarlyStrongerHomeWithBalance",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1' && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.15) ? 1 : 0",
            description: "Back early stronger home favorites with balanced odds - market uncertainty",
            betSide: "home"
        },
        {
            name: "backEarlyStrongerHomeQuality",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1' && (timeSeries.home.leaguePosition || 20) <= 8) ? 1 : 0",
            description: "Back early stronger home favorites when home team is quality (top 8)",
            betSide: "home"
        },
        {
            name: "backEarlyStrongerHomeGoodOdds",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1' && match.asianHandicapOdds.homeOdds >= 1.8 && match.asianHandicapOdds.homeOdds <= 2.0) ? 1 : 0",
            description: "Back early stronger home favorites with decent odds range",
            betSide: "home"
        },
        
        // === TEST OTHER STRONGER FAVORITES TOO ===
        {
            name: "backEarlyFullGoalHomeFavorites",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-1') ? 1 : 0",
            description: "Back early season -1 goal home favorites - full goal confidence",
            betSide: "home"
        },
        {
            name: "backEarlyVeryStrongHomeFavorites",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-1/-1.5') ? 1 : 0",
            description: "Back early very strong home favorites (-1/-1.5)",
            betSide: "home"
        },
        
        // === COMPARATIVE PATTERNS ===
        {
            name: "backEarlyAllStrongerFavorites",
            expression: "(fbref.week <= 8 && (match.asianHandicapOdds.homeHandicap === '-0.5/-1' || match.asianHandicapOdds.homeHandicap === '-1' || match.asianHandicapOdds.homeHandicap === '-1/-1.5')) ? 1 : 0",
            description: "Back all early season stronger home favorites (≥ -0.5 handicap)",
            betSide: "home"
        },
        {
            name: "backEarlyModerateToStrongFavorites",
            expression: "(fbref.week <= 8 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5) ? 1 : 0",
            description: "Back early season moderate to strong home favorites (handicap ≤ -0.5)",
            betSide: "home"
        },
        
        // === REFINED CONDITIONS ===
        {
            name: "backEarlyStrongerHomeTopSix",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1' && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Back early stronger home favorites when home team is top 6 - quality justifies confidence",
            betSide: "home"
        },
        {
            name: "backEarlyStrongerHomeVsWeakAway",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1' && (timeSeries.away.leaguePosition || 20) >= 12) ? 1 : 0",
            description: "Back early stronger home favorites vs weak away teams - quality gap justified",
            betSide: "home"
        },
        {
            name: "backEarlyStrongerHomeHighAttendance",
            expression: "(fbref.week <= 8 && match.asianHandicapOdds.homeHandicap === '-0.5/-1' && fbref.attendance > 50000) ? 1 : 0",
            description: "Back early stronger home favorites with high attendance - crowd support helps",
            betSide: "home"
        },
        
        // === THRESHOLD THEORY TESTING ===
        {
            name: "earlyThresholdTheory",
            expression: "(fbref.week <= 8 && ((match.asianHandicapOdds.homeHandicap === '0/-0.5' && -1) || (match.asianHandicapOdds.homeHandicap === '-0.5/-1' && 1) || 0))",
            description: "Threshold theory: Fade slight favorites (0/-0.5), back stronger favorites (-0.5/-1)",
            betSide: "conditional"
        }
    ],
    
    combinations: [
        {
            name: "Threshold_Favorite_Theory",
            factors: [
                "fbref.week <= 8",
                "(match.asianHandicapOdds.homeHandicap === '-0.5/-1')",
                "(timeSeries.home.leaguePosition || 20) <= 8"
            ],
            hypothesis: "Early season + stronger favorites + quality home teams = undervalued",
            type: "multi_factor",
            betSide: "home"
        },
        {
            name: "Quality_Stronger_Home_Early",
            factors: [
                "fbref.week <= 8",
                "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5",
                "(timeSeries.home.leaguePosition || 20) <= 6"
            ],
            hypothesis: "Early season + moderate/strong home favorites + top 6 teams",
            type: "multi_factor",
            betSide: "home"
        }
    ]
}; 