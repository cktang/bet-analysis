// Contextual factors using only pre-match data
function getContextualFactors(match) {
    const factors = {};
    
    // Use preMatch data only
    const preMatch = match.preMatch;
    if (!preMatch?.match) return factors;
    
    const matchDate = new Date(preMatch.match.date);
    
    // Season timing factors
    const seasonStart = new Date(matchDate.getFullYear(), 7, 1); // August 1st
    const daysSinceSeasonStart = Math.floor((matchDate - seasonStart) / (1000 * 60 * 60 * 24));
    const weekInSeason = Math.floor(daysSinceSeasonStart / 7) + 1;
    
    factors.weekInSeason = weekInSeason;
    factors.earlySeasonVolatility = weekInSeason <= 6 ? 1 : 0;
    factors.midSeasonStability = weekInSeason > 6 && weekInSeason <= 30 ? 1 : 0;
    factors.lateSeasonDesperation = weekInSeason > 30 ? 1 : 0;
    factors.seasonFatigue = weekInSeason > 35 ? 1 : 0;
    
    // Day of week and time factors
    const dayOfWeek = matchDate.getDay();
    factors.isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
    factors.isMidweek = dayOfWeek >= 2 && dayOfWeek <= 4 ? 1 : 0;
    
    // Month-based factors
    const month = matchDate.getMonth() + 1;
    factors.month = month;
    factors.isDecember = month === 12 ? 1 : 0;
    factors.isJanuary = month === 1 ? 1 : 0;
    factors.isChristmasPeriod = (month === 12 || month === 1) ? 1 : 0;
    
    // FBRef venue and referee data (pre-match known information)
    if (preMatch.fbref) {
        factors.venue = preMatch.fbref.venue || '';
        factors.referee = preMatch.fbref.referee || '';
        
        // Week number from FBRef
        if (preMatch.fbref.week) {
            factors.fbrefWeek = parseInt(preMatch.fbref.week);
        }
        
        // Expected attendance impact (if available pre-match)
        if (preMatch.fbref.attendance) {
            factors.expectedAttendance = preMatch.fbref.attendance;
            factors.highAttendance = preMatch.fbref.attendance > 50000 ? 1 : 0;
        }
    }
    
    return factors;
}

module.exports = { getContextualFactors }; 