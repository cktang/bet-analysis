// Form and streak factors using only historical timeSeries data
function getFormStreakFactors(match) {
    const factors = {};
    
    // Use timeSeries for historical form data
    const timeSeries = match.timeSeries;
    if (!timeSeries?.home || !timeSeries?.away) return factors;
    
    const homeStreaks = timeSeries.home.streaks;
    const awayStreaks = timeSeries.away.streaks;
    const homePatterns = timeSeries.home.patterns;
    const awayPatterns = timeSeries.away.patterns;
    
    // Overall form streaks
    if (homeStreaks?.overall && awayStreaks?.overall) {
        factors.homeWinStreak = homeStreaks.overall.current.type === 'win' ? homeStreaks.overall.current.count : 0;
        factors.awayWinStreak = awayStreaks.overall.current.type === 'win' ? awayStreaks.overall.current.count : 0;
        
        factors.homeLossStreak = homeStreaks.overall.current.type === 'loss' ? homeStreaks.overall.current.count : 0;
        factors.awayLossStreak = awayStreaks.overall.current.type === 'loss' ? awayStreaks.overall.current.count : 0;
        
        // Form length (number of recent matches with consistent form)
        factors.homeFormLength = homeStreaks.overall.form?.length || 0;
        factors.awayFormLength = awayStreaks.overall.form?.length || 0;
        
        // Streak disparity
        factors.streakDisparity = Math.abs(factors.homeWinStreak - factors.awayWinStreak);
    }
    
    // Venue-specific form
    if (homeStreaks?.venue && awayStreaks?.venue) {
        factors.homeVenueWinStreak = homeStreaks.venue.current.type === 'win' ? homeStreaks.venue.current.count : 0;
        factors.awayVenueWinStreak = awayStreaks.venue.current.type === 'win' ? awayStreaks.venue.current.count : 0;
        
        factors.homeVenueFormLength = homeStreaks.venue.form?.length || 0;
        factors.awayVenueFormLength = awayStreaks.venue.form?.length || 0;
    }
    
    // Over/Under form patterns
    if (homeStreaks?.overUnder && awayStreaks?.overUnder) {
        factors.homeOverStreak = homeStreaks.overUnder.current.type === 'over' ? homeStreaks.overUnder.current.count : 0;
        factors.awayOverStreak = awayStreaks.overUnder.current.type === 'over' ? awayStreaks.overUnder.current.count : 0;
        
        factors.homeUnderStreak = homeStreaks.overUnder.current.type === 'under' ? homeStreaks.overUnder.current.count : 0;
        factors.awayUnderStreak = awayStreaks.overUnder.current.type === 'under' ? awayStreaks.overUnder.current.count : 0;
    }
    
    // Win rates and patterns from historical data
    if (homePatterns && awayPatterns) {
        factors.homeWinRate = homePatterns.winRate || 0;
        factors.awayWinRate = awayPatterns.winRate || 0;
        factors.homeVenueWinRate = homePatterns.venueWinRate || 0;
        factors.awayVenueWinRate = awayPatterns.venueWinRate || 0;
        
        factors.homeOverRate = homePatterns.overRate || 0;
        factors.awayOverRate = awayPatterns.overRate || 0;
        factors.combinedOverRate = (factors.homeOverRate + factors.awayOverRate) / 2;
        
        // Goal difference patterns
        factors.homeGoalDiff = (timeSeries.home.averages?.overall?.goalsFor || 0) - (timeSeries.home.averages?.overall?.goalsAgainst || 0);
        factors.awayGoalDiff = (timeSeries.away.averages?.overall?.goalsFor || 0) - (timeSeries.away.averages?.overall?.goalsAgainst || 0);
    }
    
    return factors;
}

module.exports = { getFormStreakFactors }; 