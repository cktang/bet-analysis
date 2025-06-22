const fs = require('fs');
const path = require('path');

class BroadBiasCheck {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadAllData();
    }

    loadAllData() {
        console.log('📊 Loading ALL data for comprehensive bias check...\n');
        
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches).filter(match => 
                    match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
                    match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
                    match.match?.asianHandicapOdds
                );
                
                this.allMatches.push(...matches);
                console.log(`✅ ${season}: ${matches.length} valid matches`);
            }
        });
        
        console.log(`📊 Total: ${this.allMatches.length} matches across all seasons\n`);
    }

    checkRealMarketBehavior() {
        console.log('🏦 CHECKING REAL MARKET BEHAVIOR\n');
        console.log('═══════════════════════════════════════\n');

        let totalHomeProfit = 0;
        let totalAwayProfit = 0;
        let homeFavoredCount = 0;
        let awayFavoredCount = 0;
        let evenCount = 0;
        let totalHomeOdds = 0;
        let totalAwayOdds = 0;
        let validMatches = 0;

        // Check seasonal patterns
        const seasonalStats = {};

        this.allMatches.forEach(match => {
            const homeOdds = match.match?.asianHandicapOdds?.homeOdds;
            const awayOdds = match.match?.asianHandicapOdds?.awayOdds;
            const homeProfit = match.enhanced?.postMatch?.bettingOutcomes?.homeProfit || 0;
            const awayProfit = match.enhanced?.postMatch?.bettingOutcomes?.awayProfit || 0;
            const season = this.inferSeason(match);

            if (homeOdds && awayOdds) {
                totalHomeProfit += homeProfit;
                totalAwayProfit += awayProfit;
                totalHomeOdds += homeOdds;
                totalAwayOdds += awayOdds;
                validMatches++;

                if (homeOdds < awayOdds) {
                    homeFavoredCount++;
                } else if (awayOdds < homeOdds) {
                    awayFavoredCount++;
                } else {
                    evenCount++;
                }

                // Track by season
                if (!seasonalStats[season]) {
                    seasonalStats[season] = {
                        homeProfit: 0,
                        awayProfit: 0,
                        matches: 0,
                        homeFavored: 0,
                        awayFavored: 0
                    };
                }
                seasonalStats[season].homeProfit += homeProfit;
                seasonalStats[season].awayProfit += awayProfit;
                seasonalStats[season].matches++;
                if (homeOdds < awayOdds) seasonalStats[season].homeFavored++;
                if (awayOdds < homeOdds) seasonalStats[season].awayFavored++;
            }
        });

        console.log('📊 OVERALL MARKET STATISTICS:\n');
        console.log(`Total valid matches: ${validMatches.toLocaleString()}`);
        console.log(`Average home odds: ${(totalHomeOdds / validMatches).toFixed(3)}`);
        console.log(`Average away odds: ${(totalAwayOdds / validMatches).toFixed(3)}\n`);

        console.log('👑 WHO IS FAVORED:');
        console.log(`Home favored: ${homeFavoredCount.toLocaleString()}/${validMatches.toLocaleString()} (${(homeFavoredCount/validMatches*100).toFixed(1)}%)`);
        console.log(`Away favored: ${awayFavoredCount.toLocaleString()}/${validMatches.toLocaleString()} (${(awayFavoredCount/validMatches*100).toFixed(1)}%)`);
        console.log(`Even odds: ${evenCount.toLocaleString()}/${validMatches.toLocaleString()} (${(evenCount/validMatches*100).toFixed(1)}%)\n`);

        console.log('💰 PROFITABILITY:');
        const totalInvestment = validMatches * 100;
        const homeProfitability = (totalHomeProfit / totalInvestment) * 100;
        const awayProfitability = (totalAwayProfit / totalInvestment) * 100;
        
        console.log(`Always bet HOME: ${homeProfitability.toFixed(2)}% (${totalHomeProfit >= 0 ? '+' : ''}$${totalHomeProfit.toLocaleString()})`);
        console.log(`Always bet AWAY: ${awayProfitability.toFixed(2)}% (${totalAwayProfit >= 0 ? '+' : ''}$${totalAwayProfit.toLocaleString()})\n`);

        // Check if this makes sense from bookmaker perspective
        const bookmakerHouse = -homeProfitability - awayProfitability;
        console.log(`Bookmaker house edge: ${bookmakerHouse.toFixed(2)}%\n`);

        if (Math.abs(homeProfitability) > 5 || Math.abs(awayProfitability) > 5) {
            console.log('🚨 SUSPICIOUS: >5% systematic edge found!');
            console.log('This would bankrupt bookmakers or create obvious arbitrage.\n');
        } else if (bookmakerHouse < 2) {
            console.log('⚠️ Low house edge - unusual for betting markets\n');
        } else {
            console.log('✅ House edge looks realistic for betting markets\n');
        }

        // Seasonal breakdown
        console.log('📅 SEASONAL BREAKDOWN:\n');
        Object.entries(seasonalStats).forEach(([season, stats]) => {
            const seasonHomeProfitability = (stats.homeProfit / (stats.matches * 100)) * 100;
            const seasonAwayProfitability = (stats.awayProfit / (stats.matches * 100)) * 100;
            
            console.log(`${season}:`);
            console.log(`  Matches: ${stats.matches.toLocaleString()}`);
            console.log(`  Home profitability: ${seasonHomeProfitability.toFixed(2)}%`);
            console.log(`  Away profitability: ${seasonAwayProfitability.toFixed(2)}%`);
            console.log(`  Home favored: ${(stats.homeFavored/stats.matches*100).toFixed(1)}%`);
            console.log(`  Away favored: ${(stats.awayFavored/stats.matches*100).toFixed(1)}%\n`);
        });
    }

    inferSeason(match) {
        const date = match.fbref?.date || '';
        if (date.includes('2022') || date.includes('2023')) return '2022-2023';
        if (date.includes('2023') || date.includes('2024')) return '2023-2024';
        if (date.includes('2024') || date.includes('2025')) return '2024-2025';
        return 'Unknown';
    }

    checkMarketEfficiency() {
        console.log('⚖️ MARKET EFFICIENCY CHECK\n');
        console.log('═══════════════════════════════════\n');

        // Check if odds accurately predict outcomes
        let homeWinsWhenFavored = 0;
        let homeFavoredTotal = 0;
        let awayWinsWhenFavored = 0;
        let awayFavoredTotal = 0;
        let homeWinsOverall = 0;
        let awayWinsOverall = 0;
        let drawsOverall = 0;

        this.allMatches.slice(0, 500).forEach(match => { // Sample 500 matches for efficiency
            const homeOdds = match.match?.asianHandicapOdds?.homeOdds;
            const awayOdds = match.match?.asianHandicapOdds?.awayOdds;
            const homeScore = match.match?.homeScore || 0;
            const awayScore = match.match?.awayScore || 0;
            const homeProfit = match.enhanced?.postMatch?.bettingOutcomes?.homeProfit || 0;
            const awayProfit = match.enhanced?.postMatch?.bettingOutcomes?.awayProfit || 0;

            if (homeOdds && awayOdds) {
                // Track actual match outcomes
                if (homeScore > awayScore) homeWinsOverall++;
                else if (awayScore > homeScore) awayWinsOverall++;
                else drawsOverall++;

                // Track AH outcomes vs favorites
                if (homeOdds < awayOdds) {
                    // Home favored
                    homeFavoredTotal++;
                    if (homeProfit > 0) homeWinsWhenFavored++;
                } else if (awayOdds < homeOdds) {
                    // Away favored
                    awayFavoredTotal++;
                    if (awayProfit > 0) awayWinsWhenFavored++;
                }
            }
        });

        console.log('📊 PREDICTIVE ACCURACY:');
        console.log(`Home wins when favored: ${homeWinsWhenFavored}/${homeFavoredTotal} (${(homeWinsWhenFavored/homeFavoredTotal*100).toFixed(1)}%)`);
        console.log(`Away wins when favored: ${awayWinsWhenFavored}/${awayFavoredTotal} (${(awayWinsWhenFavored/awayFavoredTotal*100).toFixed(1)}%)\n`);

        console.log('🏆 ACTUAL MATCH OUTCOMES:');
        const totalSample = homeWinsOverall + awayWinsOverall + drawsOverall;
        console.log(`Home wins: ${homeWinsOverall}/${totalSample} (${(homeWinsOverall/totalSample*100).toFixed(1)}%)`);
        console.log(`Away wins: ${awayWinsOverall}/${totalSample} (${(awayWinsOverall/totalSample*100).toFixed(1)}%)`);
        console.log(`Draws: ${drawsOverall}/${totalSample} (${(drawsOverall/totalSample*100).toFixed(1)}%)\n`);

        // Expected rates for EPL
        console.log('📚 EXPECTED EPL RATES:');
        console.log('Home wins: ~46%, Away wins: ~29%, Draws: ~25%');
        console.log('If actual rates are very different, might indicate data issues\n');
    }

    identifyPotentialIssues() {
        console.log('🔍 POTENTIAL DATA/LOGIC ISSUES\n');
        console.log('═══════════════════════════════════\n');

        console.log('❓ QUESTIONS TO INVESTIGATE:\n');
        
        console.log('1. **Home Advantage in AH Lines**:');
        console.log('   • Are EPL AH lines systematically overvaluing home advantage?');
        console.log('   • Modern football may have reduced home advantage vs historical patterns\n');
        
        console.log('2. **Data Source Bias**:');
        console.log('   • Are these odds from a specific bookmaker with known biases?');
        console.log('   • Do different bookmakers show the same pattern?\n');
        
        console.log('3. **Selection Bias**:');
        console.log('   • Are we only seeing matches with certain characteristics?');
        console.log('   • Missing postponed/cancelled matches with different odds patterns?\n');
        
        console.log('4. **Time Period Effects**:');
        console.log('   • COVID seasons may have different home advantage patterns');
        console.log('   • Empty stadiums, different travel restrictions, etc.\n');
        
        console.log('🎯 RECOMMENDATIONS:\n');
        console.log('• Compare with other leagues (Bundesliga, Serie A)');
        console.log('• Check multiple bookmaker sources');
        console.log('• Verify against independent odds archives');
        console.log('• Test strategy on paper trading for current season');
        console.log('• Analyze line movement (opening vs closing odds)');
    }
}

if (require.main === module) {
    const checker = new BroadBiasCheck();
    checker.checkRealMarketBehavior();
    checker.checkMarketEfficiency();
    checker.identifyPotentialIssues();
}

module.exports = BroadBiasCheck;