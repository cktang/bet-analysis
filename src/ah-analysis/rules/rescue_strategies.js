// Rescue strategies based on failed strategy insights
// These transform failures into potential successes through context and motivation

module.exports = {
    name: "Rescue Strategy Factors",
    description: "New strategies inspired by analyzing why others failed",
    enabled: true,
    factors: [
        // 1. MOTIVATED POSITION STRATEGIES (rescue raw position failures)
        {
            name: "motivatedPositionHome",
            expression: "((timeSeries.home.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.home.leaguePosition || 20)) : (((timeSeries.home.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.home.leaguePosition || 20)) : 0)",
            description: "Position matters when stakes are high: Late season European or relegation pressure"
        },
        {
            name: "motivatedPositionAway", 
            expression: "((timeSeries.away.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.away.leaguePosition || 20)) : (((timeSeries.away.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.away.leaguePosition || 20)) : 0)",
            description: "Away team position with late season motivation multiplier"
        },
        
        // 2. RECENT FORM STRATEGIES (rescue historical data failures)
        {
            name: "recentFormDivergence",
            expression: "(timeSeries.home.streaks.overall.form.length >= 3) && (timeSeries.away.streaks.overall.form.length >= 3) ? Math.abs((timeSeries.home.streaks.overall.form.winRate || 0) - (timeSeries.away.streaks.overall.form.winRate || 0)) : 0",
            description: "Recent form divergence when both teams have reliable sample size"
        },
        {
            name: "qualityTeamBadForm",
            expression: "((timeSeries.home.leaguePosition || 20) <= 10 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.3 && (timeSeries.home.streaks.overall.form.length || 0) >= 3) ? 1 : 0",
            description: "Quality home team (top 10) in recent bad form - potential overreaction"
        },
        {
            name: "qualityAwayBadForm",
            expression: "((timeSeries.away.leaguePosition || 20) <= 10 && (timeSeries.away.streaks.overall.form.winRate || 1) < 0.3 && (timeSeries.away.streaks.overall.form.length || 0) >= 3) ? 1 : 0",
            description: "Quality away team (top 10) in recent bad form - market overreaction"
        },
        
        // 3. EXTREME MARKET BIAS STRATEGIES (rescue market bias failures)
        {
            name: "extremeMarketOverconfidence",
            expression: "(preMatch.enhanced.homeImpliedProb > 75 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.4) ? 1 : 0",
            description: "Market extremely confident in home team despite poor recent form"
        },
        {
            name: "extremeAwayUndervaluation",
            expression: "(preMatch.enhanced.awayImpliedProb < 15 && (timeSeries.away.leaguePosition || 20) <= 8 && (timeSeries.away.streaks.overall.form.winRate || 0) > 0.5) ? 1 : 0", 
            description: "Market undervalues quality away team with good recent form"
        },
        
        // 4. SMART POSITION GAP STRATEGIES (rescue position gap failures)
        {
            name: "meaningfulPositionGap",
            expression: "(Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0",
            description: "Large position gaps only matter when European spots or relegation involved"
        },
        {
            name: "positionFormAlignment",
            expression: "((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20) > 5) && ((timeSeries.home.streaks.overall.form.winRate || 0) - (timeSeries.away.streaks.overall.form.winRate || 0) > 0.3) ? 1 : 0",
            description: "Position gap supported by recent form - home team much better in both"
        },
        
        // 5. REVERSE PSYCHOLOGY STRATEGIES (opposite of what failed)
        {
            name: "fallingGiantHome",
            expression: "((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && preMatch.enhanced.homeImpliedProb > 50) ? 1 : 0",
            description: "Good home team on losing streak but market still backs them - fade the favorite"
        },
        {
            name: "risingUnderdog",
            expression: "((timeSeries.away.leaguePosition || 20) >= 12 && (timeSeries.away.streaks.overall.current.type === 'W' || timeSeries.away.streaks.overall.current.type === 'win') && (timeSeries.away.streaks.overall.current.count || 0) >= 2 && preMatch.enhanced.awayImpliedProb < 25) ? 1 : 0",
            description: "Lower table away team on winning streak but market still undervalues"
        },
        
        // 6. SEASONAL TIMING STRATEGIES (when do failures become successes?)
        {
            name: "earlySeasonUncertainty",
            expression: "(fbref.week <= 8) ? Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) : 0",
            description: "Early season position gaps when table is unreliable"
        },
        {
            name: "lateSeasonDesperation",
            expression: "(fbref.week >= 32) ? Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20)) : 0",
            description: "Late season relegation desperation multiplier"
        },
        
        // 7. MARKET INEFFICIENCY EXPLOITATION
        {
            name: "marketLagIndicator",
            expression: "((timeSeries.home.leaguePosition || 20) > 12 && preMatch.enhanced.homeImpliedProb > 60 && (timeSeries.home.streaks.overall.form.winRate || 0) < 0.3) ? 1 : 0",
            description: "Market slow to adjust to declining form of lower table home team"
        },
        {
            name: "reputationVsReality",
            expression: "((timeSeries.away.leaguePosition || 20) <= 6 && preMatch.enhanced.awayImpliedProb > 70 && (timeSeries.away.cumulative.overall.goalDifference || 0) < 0) ? 1 : 0",
            description: "Top 6 away team with poor goal difference but market still overvalues"
        }
    ],
    
    combinations: [
        {
            name: "Motivated_Position_Rescue",
            factors: [
                "((timeSeries.home.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.home.leaguePosition || 20)) : (((timeSeries.home.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.home.leaguePosition || 20)) : 0)",
                "((timeSeries.away.leaguePosition || 20) <= 6 && fbref.week >= 30) ? (7 - (timeSeries.away.leaguePosition || 20)) : (((timeSeries.away.leaguePosition || 20) >= 17 && fbref.week >= 25) ? (21 - (timeSeries.away.leaguePosition || 20)) : 0)"
            ],
            hypothesis: "Position becomes predictive when stakes are high - late season European/relegation battles",
            type: "motivated_position"
        },
        {
            name: "Quality_Team_Overreaction",
            factors: [
                "((timeSeries.home.leaguePosition || 20) <= 10 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.3 && (timeSeries.home.streaks.overall.form.length || 0) >= 3) ? 1 : 0",
                "preMatch.enhanced.homeImpliedProb"
            ],
            hypothesis: "Market overreacts to good teams in temporary bad form",
            type: "overreaction_fade"
        },
        {
            name: "Extreme_Market_Correction",
            factors: [
                "(preMatch.enhanced.homeImpliedProb > 75 && (timeSeries.home.streaks.overall.form.winRate || 1) < 0.4) ? 1 : 0",
                "(preMatch.enhanced.awayImpliedProb < 15 && (timeSeries.away.leaguePosition || 20) <= 8 && (timeSeries.away.streaks.overall.form.winRate || 0) > 0.5) ? 1 : 0"
            ],
            hypothesis: "Extreme market confidence creates value when contradicted by form",
            type: "market_overconfidence"
        },
        {
            name: "Smart_Position_Gap",
            factors: [
                "(Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) >= 8) && (((timeSeries.home.leaguePosition || 20) <= 6 || (timeSeries.away.leaguePosition || 20) <= 6) || ((timeSeries.home.leaguePosition || 20) >= 15 || (timeSeries.away.leaguePosition || 20) >= 15)) ? 1 : 0",
                "((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20) > 5) && ((timeSeries.home.streaks.overall.form.winRate || 0) - (timeSeries.away.streaks.overall.form.winRate || 0) > 0.3) ? 1 : 0"
            ],
            hypothesis: "Position gaps work when stakes are involved and form aligns",
            type: "contextual_position"
        },
        {
            name: "Falling_Giant_Fade",
            factors: [
                "((timeSeries.home.leaguePosition || 20) <= 8 && (timeSeries.home.streaks.overall.longest.loss || 0) >= 3 && preMatch.enhanced.homeImpliedProb > 50) ? 1 : 0",
                "match.homeWinOdds"
            ],
            hypothesis: "Fade quality home teams on losing streaks that market still backs",
            type: "reverse_psychology"
        },
        {
            name: "Rising_Underdog_Back",
            factors: [
                "((timeSeries.away.leaguePosition || 20) >= 12 && (timeSeries.away.streaks.overall.current.type === 'W' || timeSeries.away.streaks.overall.current.type === 'win') && (timeSeries.away.streaks.overall.current.count || 0) >= 2 && preMatch.enhanced.awayImpliedProb < 25) ? 1 : 0",
                "match.awayWinOdds"
            ],
            hypothesis: "Back lower table away teams on winning streaks that market undervalues",
            type: "momentum_undervaluation"
        },
        {
            name: "Market_Lag_Exploitation",
            factors: [
                "((timeSeries.home.leaguePosition || 20) > 12 && preMatch.enhanced.homeImpliedProb > 60 && (timeSeries.home.streaks.overall.form.winRate || 0) < 0.3) ? 1 : 0",
                "((timeSeries.away.leaguePosition || 20) <= 6 && preMatch.enhanced.awayImpliedProb > 70 && (timeSeries.away.cumulative.overall.goalDifference || 0) < 0) ? 1 : 0"
            ],
            hypothesis: "Market slow to adjust to form changes - exploit the lag",
            type: "market_lag"
        },
        {
            name: "Seasonal_Context_Switch",
            factors: [
                "(fbref.week <= 8) ? Math.abs((timeSeries.away.leaguePosition || 20) - (timeSeries.home.leaguePosition || 20)) : 0",
                "(fbref.week >= 32) ? Math.max(0, 18 - (timeSeries.home.leaguePosition || 20)) + Math.max(0, 18 - (timeSeries.away.leaguePosition || 20)) : 0"
            ],
            hypothesis: "Same factors work differently at different times of season",
            type: "seasonal_switching"
        }
    ]
};