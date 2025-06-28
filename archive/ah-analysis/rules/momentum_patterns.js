// Momentum and pattern factors (pre-match only)

module.exports = {
    name: "Momentum and Pattern Factors", 
    description: "Advanced momentum indicators and behavioral patterns",
    enabled: true,
    factors: [
        // Momentum differential factors
        {
            name: "streakDifferential",
            expression: "(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)",
            description: "Current streak differential (home - away)"
        },
        {
            name: "goalDiffMomentum",
            expression: "(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)",
            description: "Goal difference momentum comparison"
        },
        {
            name: "ahSuccessGap",
            expression: "(timeSeries.home.cumulative.markets.asianHandicapWinRate || 0) - (timeSeries.away.cumulative.markets.asianHandicapWinRate || 0)",
            description: "Asian Handicap success rate gap"
        },
        
        // Form recent vs historical
        {
            name: "homeFormLength",
            expression: "timeSeries.home.streaks.overall.form.length || 0",
            description: "Home team form sample size"
        },
        {
            name: "awayFormLength", 
            expression: "timeSeries.away.streaks.overall.form.length || 0",
            description: "Away team form sample size"
        },
        
        // Venue-specific factors
        {
            name: "homeVenueMatches",
            expression: "timeSeries.home.venueMatches || 0",
            description: "Home team matches at this venue"
        },
        {
            name: "awayVenueMatches",
            expression: "timeSeries.away.venueMatches || 0", 
            description: "Away team matches at this venue"
        },
        {
            name: "homeVenueStreak",
            expression: "timeSeries.home.streaks.venue.current.count || 0",
            description: "Home team current venue streak"
        },
        {
            name: "awayVenueStreak",
            expression: "timeSeries.away.streaks.venue.current.count || 0",
            description: "Away team current venue streak"
        },
        
        // Over/Under momentum
        {
            name: "homeOverStreak",
            expression: "timeSeries.home.streaks.overUnder.current.count || 0",
            description: "Home team over/under streak"
        },
        {
            name: "awayOverStreak",
            expression: "timeSeries.away.streaks.overUnder.current.count || 0",
            description: "Away team over/under streak"
        },
        {
            name: "combinedOverRate",
            expression: "((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2",
            description: "Combined team over rate"
        }
    ],
    combinations: [
        {
            name: "Momentum_Clash",
            factors: [
                "(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)",
                "(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)"
            ],
            hypothesis: "Teams with opposing momentum create predictable Asian Handicap value",
            type: "momentum_differential"
        },
        {
            name: "Hot_vs_Cold_Teams",
            factors: [
                "Math.max(timeSeries.home.streaks.overall.longest.win || 0, timeSeries.away.streaks.overall.longest.win || 0)",
                "Math.max(timeSeries.home.streaks.overall.longest.loss || 0, timeSeries.away.streaks.overall.longest.loss || 0)"
            ],
            hypothesis: "Extreme form differences (hot vs cold) create betting opportunities",
            type: "form_extreme"
        },
        {
            name: "Venue_Familiarity",
            factors: [
                "timeSeries.home.venueMatches || 0",
                "timeSeries.away.venueMatches || 0"
            ],
            hypothesis: "Venue experience affects performance relative to handicap lines",
            type: "venue_advantage"
        },
        {
            name: "AH_Momentum_vs_Market",
            factors: [
                "(timeSeries.home.cumulative.markets.asianHandicapWinRate || 0) - (timeSeries.away.cumulative.markets.asianHandicapWinRate || 0)",
                "preMatch.enhanced.homeImpliedProb - preMatch.enhanced.awayImpliedProb"
            ],
            hypothesis: "Asian Handicap form vs market expectations reveals value",
            type: "market_vs_form"
        },
        {
            name: "Over_Under_Correlation",
            factors: [
                "((timeSeries.home.cumulative.markets.overRate || 0) + (timeSeries.away.cumulative.markets.overRate || 0)) / 2",
                "match.over2_5Odds"
            ],
            hypothesis: "Team over/under patterns affect game flow and AH outcomes",
            type: "scoring_style"
        },
        {
            name: "Form_Sustainability",
            factors: [
                "timeSeries.home.streaks.overall.form.length || 0",
                "timeSeries.away.streaks.overall.form.length || 0",
                "fbref.week"
            ],
            hypothesis: "Form sustainability varies by season stage and sample size",
            type: "form_reliability"
        },
        {
            name: "Streak_vs_Quality",
            factors: [
                "Math.abs((timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0))",
                "Math.abs(preMatch.enhanced.homeImpliedProb - preMatch.enhanced.awayImpliedProb)"
            ],
            hypothesis: "Streak momentum vs underlying quality creates mispricing",
            type: "momentum_vs_ability"
        }
    ]
};