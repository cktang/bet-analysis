// Comprehensive clean factors using only pre-match data
const { getOddsFactors } = require('./odds_factors');
const { getLeaguePositionFactors } = require('./league_position');
const { getFormStreakFactors } = require('./form_streaks');
const { getContextualFactors } = require('./contextual_factors');
const { getXGFactors } = require('./xg_factors');
const { getMarketEfficiencyFactors } = require('./market_efficiency');

// Extract all factors for a match using only pre-match data
function extractAllFactors(match) {
    const allFactors = {
        ...getOddsFactors(match),
        ...getLeaguePositionFactors(match),
        ...getFormStreakFactors(match),
        ...getContextualFactors(match),
        ...getXGFactors(match),
        ...getMarketEfficiencyFactors(match)
    };
    
    return allFactors;
}

module.exports = {
    name: 'Clean Comprehensive Factors',
    description: 'All factors using only legitimate pre-match data',
    enabled: true,
    
    factors: [
        // Odds-based factors
        {
            name: 'homeWinOdds',
            expression: 'preMatch.match.homeWinOdds',
            description: 'Home team win odds'
        },
        {
            name: 'awayWinOdds', 
            expression: 'preMatch.match.awayWinOdds',
            description: 'Away team win odds'
        },
        {
            name: 'oddsRatio',
            expression: 'preMatch.match.homeWinOdds / preMatch.match.awayWinOdds',
            description: 'Ratio of home to away win odds'
        },
        {
            name: 'marketEfficiency',
            expression: 'preMatch.enhanced.marketEfficiency',
            description: 'Market efficiency rating'
        },
        {
            name: 'homeValueBet',
            expression: 'preMatch.enhanced.homeValueBet',
            description: 'Home team value betting indicator'
        },
        
        // League position factors
        {
            name: 'homePosition',
            expression: 'timeSeries.home.leaguePosition',
            description: 'Home team league position'
        },
        {
            name: 'awayPosition',
            expression: 'timeSeries.away.leaguePosition', 
            description: 'Away team league position'
        },
        {
            name: 'positionDiff',
            expression: 'timeSeries.home.leaguePosition - timeSeries.away.leaguePosition',
            description: 'League position difference'
        },
        {
            name: 'topSixBattle',
            expression: '(timeSeries.home.leaguePosition <= 6 && timeSeries.away.leaguePosition <= 6) ? 1 : 0',
            description: 'Both teams in top 6'
        },
        {
            name: 'relegationPressure',
            expression: 'Math.max(0, 18 - Math.min(timeSeries.home.leaguePosition, timeSeries.away.leaguePosition))',
            description: 'Relegation pressure indicator'
        },
        
        // Form and streak factors
        {
            name: 'homeWinRate',
            expression: 'timeSeries.home.patterns.winRate',
            description: 'Home team historical win rate'
        },
        {
            name: 'awayWinRate',
            expression: 'timeSeries.away.patterns.winRate',
            description: 'Away team historical win rate'
        },
        {
            name: 'homeVenueWinRate',
            expression: 'timeSeries.home.patterns.venueWinRate',
            description: 'Home team venue-specific win rate'
        },
        {
            name: 'homeOverRate',
            expression: 'timeSeries.home.patterns.overRate',
            description: 'Home team over 2.5 goals rate'
        },
        {
            name: 'awayOverRate',
            expression: 'timeSeries.away.patterns.overRate',
            description: 'Away team over 2.5 goals rate'
        },
        {
            name: 'combinedOverRate',
            expression: '(timeSeries.home.patterns.overRate + timeSeries.away.patterns.overRate) / 2',
            description: 'Combined over 2.5 goals rate'
        },
        {
            name: 'homeGoalDiff',
            expression: '(timeSeries.home.averages.overall.goalsFor - timeSeries.home.averages.overall.goalsAgainst)',
            description: 'Home team goal difference'
        },
        {
            name: 'awayGoalDiff',
            expression: '(timeSeries.away.averages.overall.goalsFor - timeSeries.away.averages.overall.goalsAgainst)',
            description: 'Away team goal difference'
        },
        
        // Contextual factors
        {
            name: 'weekInSeason',
            expression: 'Math.floor((new Date(preMatch.match.date) - new Date(new Date(preMatch.match.date).getFullYear(), 7, 1)) / (1000 * 60 * 60 * 24 * 7)) + 1',
            description: 'Week number in season'
        },
        {
            name: 'earlySeasonVolatility',
            expression: 'Math.floor((new Date(preMatch.match.date) - new Date(new Date(preMatch.match.date).getFullYear(), 7, 1)) / (1000 * 60 * 60 * 24 * 7)) + 1 <= 6 ? 1 : 0',
            description: 'Early season volatility indicator'
        },
        {
            name: 'lateSeasonDesperation',
            expression: 'Math.floor((new Date(preMatch.match.date) - new Date(new Date(preMatch.match.date).getFullYear(), 7, 1)) / (1000 * 60 * 60 * 24 * 7)) + 1 > 30 ? 1 : 0',
            description: 'Late season desperation indicator'
        },
        
        // Historical XG factors (legitimate)
        {
            name: 'homeHistoricalXGFor',
            expression: 'timeSeries.home.averages.overall.xGFor',
            description: 'Home team historical XG for'
        },
        {
            name: 'awayHistoricalXGFor',
            expression: 'timeSeries.away.averages.overall.xGFor',
            description: 'Away team historical XG for'
        },
        {
            name: 'homeVenueXGFor',
            expression: 'timeSeries.home.averages.venue.xGFor',
            description: 'Home team venue XG for'
        },
        {
            name: 'awayVenueXGFor',
            expression: 'timeSeries.away.averages.venue.xGFor',
            description: 'Away team venue XG for'
        },
        {
            name: 'predictedXGLine',
            expression: '((timeSeries.home.averages.venue.xGFor + timeSeries.away.averages.venue.xGAgainst) / 2) - ((timeSeries.away.averages.venue.xGFor + timeSeries.home.averages.venue.xGAgainst) / 2)',
            description: 'Predicted XG line based on historical data'
        }
    ],
    
    combinations: [
        {
            name: 'Position_Value_Betting',
            factors: ['positionDiff', 'homeValueBet'],
            hypothesis: 'League position differences create value betting opportunities'
        },
        {
            name: 'Historical_Form_Odds',
            factors: ['homeVenueWinRate', 'oddsRatio'],
            hypothesis: 'Historical venue form vs market odds'
        },
        {
            name: 'Goal_Difference_Market',
            factors: ['homeGoalDiff - awayGoalDiff', 'marketEfficiency'],
            hypothesis: 'Goal difference patterns in efficient markets'
        },
        {
            name: 'Seasonal_Position_Pressure',
            factors: ['weekInSeason', 'relegationPressure'],
            hypothesis: 'Season timing affects relegation pressure'
        },
        {
            name: 'Venue_XG_Efficiency',
            factors: ['homeVenueXGFor', 'awayVenueXGFor', 'predictedXGLine'],
            hypothesis: 'Venue-specific XG patterns predict outcomes'
        }
    ],
    
    extractAllFactors
}; 