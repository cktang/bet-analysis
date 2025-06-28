// Creative Edge Strategies - Novel approaches to Asian Handicap value detection
// Focus on untapped market inefficiencies and psychological biases

module.exports = {
    name: "Creative Edge Strategies",
    description: "Innovative betting strategies exploiting calendar effects, market psychology, and multi-dimensional patterns",
    enabled: true,
    factors: [
        // === CALENDAR PSYCHOLOGY ===
        {
            name: "postChristmasAwayValue",
            expression: "(fbref.week >= 18 && fbref.week <= 22 && (timeSeries.away.leaguePosition || 20) <= 10) ? 1 : 0",
            description: "Away teams perform better in post-Christmas period due to travel disruption equalization",
            betSide: "away"
        },
        {
            name: "newYearResetFade",
            expression: "(fbref.week === 21 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5) ? 1 : 0",
            description: "New Year psychological reset favors underdogs",
            betSide: "away"
        },
        {
            name: "veryEarlySeasonAll",
            expression: "(fbref.week <= 3 && Math.abs(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])) <= 0.75) ? 1 : 0",
            description: "Maximum uncertainty in first 3 weeks creates value in close handicaps",
            betSide: "away"
        },
        
        // === MARKET INEFFICIENCY ARBITRAGE ===
        {
            name: "ahVs1x2Divergence",
            expression: "((1/match.asianHandicapOdds.homeOdds + 1/match.asianHandicapOdds.awayOdds) - (1/match.homeWinOdds + 1/match.awayWinOdds + 1/match.drawOdds)) < -0.02 ? 1 : 0",
            description: "When AH market is more efficient than 1X2, bet the AH"
        },
        {
            name: "overUnderAhCrossover",
            expression: "(match.over2_5Odds < 1.8 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.5) ? 1 : 0",
            description: "Low over/under odds + pick'em handicap suggests goals and competitiveness"
        },
        {
            name: "oddsCompression",
            expression: "(match.asianHandicapOdds.homeOdds >= 1.85 && match.asianHandicapOdds.homeOdds <= 2.0 && match.asianHandicapOdds.awayOdds >= 1.85 && match.asianHandicapOdds.awayOdds <= 2.0) ? 1 : 0",
            description: "Compressed odds range indicates market uncertainty - bet home in close games"
        },
        
        // === DYNAMIC POSITION MOMENTUM ===
        {
            name: "risingTeamMarketLag",
            expression: "((timeSeries.home.leaguePosition || 20) > 12 && (timeSeries.home.streaks.overall.form.winRate || 0) > 0.6 && preMatch.enhanced.homeImpliedProb < 40) ? 1 : 0",
            description: "Market slow to recognize improving lower-table teams"
        },
        {
            name: "fallingGiantOverconfidence",
            expression: "((timeSeries.home.leaguePosition || 20) <= 6 && (timeSeries.home.cumulative.overall.goalDifference || 0) < 0 && preMatch.enhanced.homeImpliedProb > 65) ? 1 : 0",
            description: "Market overconfident in struggling big teams",
            betSide: "away"
        },
        {
            name: "positionFormDivergence",
            expression: "((timeSeries.away.leaguePosition || 20) > 10 && (timeSeries.away.streaks.overall.form.winRate || 0) > 0.7 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5) ? 1 : 0",
            description: "Good form away teams in lower positions getting handicap value",
            betSide: "away"
        },
        
        // === MULTI-DIMENSIONAL VALUE DETECTION ===
        {
            name: "tripleFadeSignal",
            expression: "(fbref.week <= 10 && (timeSeries.home.leaguePosition || 20) >= 15 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5 && Math.abs(match.asianHandicapOdds.homeOdds - match.asianHandicapOdds.awayOdds) <= 0.15) ? 1 : 0",
            description: "Early season + weak home favorite + balanced odds = away value",
            betSide: "away"
        },
        {
            name: "qualityMismatchExploiter",
            expression: "((timeSeries.away.leaguePosition || 20) <= 6 && (timeSeries.home.leaguePosition || 20) >= 10 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.25) ? 1 : 0",
            description: "Quality away teams getting any points start should be backed",
            betSide: "away"
        },
        {
            name: "sweetSpotUnderdog",
            expression: "(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 0.5 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= 1.0 && (timeSeries.home.leaguePosition || 20) <= 12) ? 1 : 0",
            description: "Decent home teams getting moderate handicap start - market may underestimate"
        },
        
        // === CONTRARIAN PRESSURE POINTS ===
        {
            name: "relegationDesperation",
            expression: "(fbref.week >= 32 && ((timeSeries.home.leaguePosition || 20) >= 17 || (timeSeries.away.leaguePosition || 20) >= 17) && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.5) ? 1 : 0",
            description: "Late season relegation battles favor underdogs due to pressure"
        },
        {
            name: "euroChaseOverreach",
            expression: "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) >= 7 && (timeSeries.home.leaguePosition || 20) <= 10 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -1) ? 1 : 0",
            description: "Teams chasing Europe become over-aggressive, creating value for opponents",
            betSide: "away"
        },
        {
            name: "safeMidTableChaos",
            expression: "(fbref.week >= 30 && (timeSeries.home.leaguePosition || 20) >= 11 && (timeSeries.home.leaguePosition || 20) <= 16 && (timeSeries.away.leaguePosition || 20) >= 11 && (timeSeries.away.leaguePosition || 20) <= 16) ? 1 : 0",
            description: "Safe mid-table teams in late season create unpredictable results",
            betSide: "away"
        },
        
        // === MOMENTUM REVERSAL PATTERNS ===
        {
            name: "hotStreakFatigue",
            expression: "((timeSeries.home.streaks.overall.current.count || 0) >= 4 && timeSeries.home.streaks.overall.current.type === 'W' && preMatch.enhanced.homeImpliedProb > 70) ? 1 : 0",
            description: "Long winning streaks create overconfidence, regression likely",
            betSide: "away"
        },
        {
            name: "coldStreakBounce",
            expression: "((timeSeries.away.streaks.overall.current.count || 0) >= 3 && (timeSeries.away.streaks.overall.current.type === 'L' || timeSeries.away.streaks.overall.current.type === 'loss') && (timeSeries.away.leaguePosition || 20) <= 10 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.75) ? 1 : 0",
            description: "Quality teams on losing streaks represent value when getting points",
            betSide: "away"
        },
        {
            name: "momentumExhaustion",
            expression: "((timeSeries.home.streaks.overall.current.count || 0) >= 3 && (timeSeries.home.cumulative.overall.goalDifference || 0) > 10 && preMatch.enhanced.homeImpliedProb > 75) ? 1 : 0",
            description: "Teams riding high momentum become overvalued by market",
            betSide: "away"
        },
        
        // === VENUE & CONTEXT EXPLOITATION ===
        {
            name: "lowAttendanceNeutralizer",
            expression: "(fbref.attendance < 30000 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) <= -0.5) ? 1 : 0",
            description: "Low attendance reduces home advantage, creating away value",
            betSide: "away"
        },
        {
            name: "bigCrowdPressure",
            expression: "(fbref.attendance > 65000 && (timeSeries.home.leaguePosition || 20) <= 6 && (timeSeries.home.streaks.overall.form.winRate || 0) < 0.4) ? 1 : 0",
            description: "Big crowds create pressure on underperforming big teams",
            betSide: "away"
        },
        {
            name: "atmosphereAdvantage",
            expression: "(fbref.attendance > 50000 && (timeSeries.home.leaguePosition || 20) <= 8 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.25) ? 1 : 0",
            description: "Big atmosphere helps good home teams even without market confidence"
        },
        
        // === MARKET PSYCHOLOGY EXPLOITATION ===
        {
            name: "roundNumberBias",
            expression: "(parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) === -1.0 && (timeSeries.home.leaguePosition || 20) >= 8) ? 1 : 0",
            description: "Market overvalues round number handicaps for non-elite teams",
            betSide: "away"
        },
        {
            name: "priceAnchoring",
            expression: "(match.homeWinOdds >= 2.8 && match.homeWinOdds <= 3.2 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= 0) ? 1 : 0",
            description: "Sweet spot where home teams are undervalued in both markets"
        },
        {
            name: "oddsBandwidth",
            expression: "(match.asianHandicapOdds.homeOdds <= 1.7 && parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.5) ? 1 : 0",
            description: "Low odds with small handicap suggests market inefficiency"
        }
    ],
    
    combinations: [
        {
            name: "Calendar_Market_Lag",
            factors: [
                "(fbref.week >= 18 && fbref.week <= 22)",
                "preMatch.enhanced.homeImpliedProb > 60",
                "(timeSeries.away.leaguePosition || 20) <= 8"
            ],
            hypothesis: "Post-Christmas period + market overconfidence + quality away team",
            type: "multi_factor",
            betSide: "away"
        },
        {
            name: "Position_Form_Value",
            factors: [
                "(timeSeries.home.leaguePosition || 20) > 10",
                "(timeSeries.home.streaks.overall.form.winRate || 0) > 0.6",
                "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0]) >= -0.5"
            ],
            hypothesis: "Improving team + market lag + favorable handicap",
            type: "multi_factor"
        },
        {
            name: "Pressure_Momentum_Reversal",
            factors: [
                "fbref.week >= 30",
                "(timeSeries.home.streaks.overall.current.count || 0) >= 3",
                "preMatch.enhanced.homeImpliedProb > 70"
            ],
            hypothesis: "Late season + momentum + overconfidence = reversal opportunity",
            type: "multi_factor",
            betSide: "away"
        }
    ]
}; 