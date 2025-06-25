// Simplified rescue strategies that should work with current data structure
// Based on lessons learned from failed strategies

module.exports = {
    name: "Simple Rescue Strategy Factors",
    description: "Simplified rescue strategies inspired by failed strategy analysis",
    enabled: true,
    factors: [
        // 1. LATE SEASON POSITION MOTIVATION (rescue raw position failures)
        {
            name: "lateSeasonTopSix",
            expression: "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Home team in top 6 during late season (European pressure)"
        },
        {
            name: "lateSeasonRelegation",
            expression: "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) >= 17) ? 1 : 0",
            description: "Home team in relegation zone during late season (survival pressure)"
        },
        {
            name: "awayLateSeasonTopSix",
            expression: "(fbref.week >= 30 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Away team in top 6 during late season"
        },
        
        // 2. FORM VS POSITION DIVERGENCE (rescue historical data failures)
        {
            name: "goodTeamBadForm",
            expression: "((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.4) ? 1 : 0",
            description: "Quality home team (top 8) with poor recent form"
        },
        {
            name: "badTeamGoodForm", 
            expression: "((timeSeries.away.leaguePosition || 20) >= 15 && (timeSeries.away.streaks.overall.form.winRate || 0) > 0.6) ? 1 : 0",
            description: "Lower table away team with good recent form"
        },
        
        // 3. EXTREME MARKET SCENARIOS (rescue market bias failures)
        {
            name: "extremeHomeFavorite",
            expression: "(preMatch.enhanced.homeImpliedProb > 80) ? 1 : 0",
            description: "Extreme home favorites (>80% implied probability)"
        },
        {
            name: "extremeAwayUnderdog",
            expression: "(preMatch.enhanced.awayImpliedProb < 10) ? 1 : 0",
            description: "Extreme away underdogs (<10% implied probability)"
        },
        
        // 4. SEASONAL TIMING FACTORS
        {
            name: "earlySeasonUncertainty",
            expression: "(fbref.week <= 6) ? 1 : 0",
            description: "Very early season when positions are unreliable"
        },
        {
            name: "businessEnd",
            expression: "(fbref.week >= 35) ? 1 : 0",
            description: "Final stretch of season when every point matters"
        },
        
        // 5. REVERSE PSYCHOLOGY FACTORS
        {
            name: "favoriteOnLosers",
            expression: "((timeSeries.home.streaks.overall.current.type === 'L' || timeSeries.home.streaks.overall.current.type === 'loss') && preMatch.enhanced.homeImpliedProb > 60) ? 1 : 0",
            description: "Home team on losing streak but still market favorite"
        },
        {
            name: "underdogOnWinners",
            expression: "((timeSeries.away.streaks.overall.current.type === 'W' || timeSeries.away.streaks.overall.current.type === 'win') && preMatch.enhanced.awayImpliedProb < 30) ? 1 : 0",
            description: "Away team on winning streak but still underdog"
        },
        
        // 6. SIMPLE POSITION CONTEXT 
        {
            name: "bigSixClash",
            expression: "((timeSeries.home.leaguePosition || 20) <= 6 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0",
            description: "Both teams in traditional 'Big 6' positions"
        },
        {
            name: "relegationSixPointer",
            expression: "((timeSeries.home.leaguePosition || 20) >= 17 && (timeSeries.away.leaguePosition || 20) >= 17) ? 1 : 0",
            description: "Both teams in relegation zone (six-pointer)"
        }
    ],
    
    combinations: [
        {
            name: "Late_Season_Pressure_Rescue",
            factors: [
                "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) <= 6) ? 1 : 0",
                "(fbref.week >= 30 && (timeSeries.away.leaguePosition || 20) <= 6) ? 1 : 0"
            ],
            hypothesis: "Late season European pressure creates value - rescue for raw position failures",
            type: "seasonal_motivation"
        },
        {
            name: "Form_Position_Divergence_Rescue",
            factors: [
                "((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.4) ? 1 : 0",
                "preMatch.enhanced.homeImpliedProb"
            ],
            hypothesis: "Market overvalues good teams in bad form - rescue for form vs ability disconnect",
            type: "overreaction_rescue"
        },
        {
            name: "Extreme_Market_Rescue",
            factors: [
                "(preMatch.enhanced.homeImpliedProb > 80) ? 1 : 0",
                "((timeSeries.home.streaks.overall.current.type === 'L' || timeSeries.home.streaks.overall.current.type === 'loss') && preMatch.enhanced.homeImpliedProb > 60) ? 1 : 0"
            ],
            hypothesis: "Extreme market confidence in teams with poor form - rescue for market bias failures",
            type: "market_overconfidence"
        },
        {
            name: "Early_Season_Position_Rescue",
            factors: [
                "(fbref.week <= 6) ? 1 : 0",
                "(timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)"
            ],
            hypothesis: "Position gaps matter less in early season - rescue for position gap failures",
            type: "temporal_context"
        },
        {
            name: "Reverse_Psychology_Rescue", 
            factors: [
                "((timeSeries.home.streaks.overall.current.type === 'L' || timeSeries.home.streaks.overall.current.type === 'loss') && preMatch.enhanced.homeImpliedProb > 60) ? 1 : 0",
                "((timeSeries.away.streaks.overall.current.type === 'W' || timeSeries.away.streaks.overall.current.type === 'win') && preMatch.enhanced.awayImpliedProb < 30) ? 1 : 0"
            ],
            hypothesis: "Market slow to adjust to recent form changes - rescue for momentum vs market disconnect",
            type: "contrarian_rescue"
        },
        {
            name: "Six_Pointer_Rescue",
            factors: [
                "((timeSeries.home.leaguePosition || 20) >= 17 && (timeSeries.away.leaguePosition || 20) >= 17) ? 1 : 0",
                "fbref.week"
            ],
            hypothesis: "Relegation six-pointers become more valuable later in season - rescue for relegation battle analysis",
            type: "stakes_amplification"
        }
    ]
};