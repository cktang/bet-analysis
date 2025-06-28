const fs = require('fs');
const path = require('path');

class DebugFormData {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('📊 Loading data to debug form/streak factors...\n');
        
        const seasonPath = path.join(this.dataPath, 'year-2023-2024.json');
        const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
        this.allMatches = Object.values(seasonData.matches);
        
        console.log(`Total matches loaded: ${this.allMatches.length}\n`);
    }

    analyzeTimeSeriesStructure() {
        console.log('🔍 ANALYZING TIME SERIES DATA STRUCTURE\n');
        console.log('═════════════════════════════════════════\n');

        // Check first 10 matches for timeSeries data
        let timeSeriesCount = 0;
        let populatedCount = 0;
        
        this.allMatches.slice(0, 20).forEach((match, i) => {
            const hasTimeSeries = !!match.timeSeries;
            const homeData = match.timeSeries?.home;
            const awayData = match.timeSeries?.away;
            
            if (hasTimeSeries) timeSeriesCount++;
            
            const homeMatches = homeData?.matchesPlayed || 0;
            const awayMatches = awayData?.matchesPlayed || 0;
            
            if (homeMatches > 0 || awayMatches > 0) populatedCount++;
            
            console.log(`${i+1}. ${match.match?.homeTeam} vs ${match.match?.awayTeam}`);
            console.log(`   Week: ${match.fbref?.week || 'N/A'}`);
            console.log(`   Has timeSeries: ${hasTimeSeries}`);
            console.log(`   Home matches played: ${homeMatches}`);
            console.log(`   Away matches played: ${awayMatches}`);
            
            if (homeMatches > 0) {
                console.log(`   Home current streak: ${homeData?.streaks?.overall?.current?.type || 'N/A'} (${homeData?.streaks?.overall?.current?.count || 0})`);
                console.log(`   Home goal diff: ${homeData?.cumulative?.overall?.goalDifference || 0}`);
                console.log(`   Home AH win rate: ${homeData?.cumulative?.markets?.asianHandicapWinRate || 0}`);
            }
            
            if (awayMatches > 0) {
                console.log(`   Away current streak: ${awayData?.streaks?.overall?.current?.type || 'N/A'} (${awayData?.streaks?.overall?.current?.count || 0})`);
                console.log(`   Away goal diff: ${awayData?.cumulative?.overall?.goalDifference || 0}`);
                console.log(`   Away AH win rate: ${awayData?.cumulative?.markets?.asianHandicapWinRate || 0}`);
            }
            
            console.log('');
        });

        console.log(`📊 SUMMARY (first 20 matches):`);
        console.log(`Matches with timeSeries structure: ${timeSeriesCount}/20`);
        console.log(`Matches with populated data: ${populatedCount}/20\n`);
    }

    testFormFactorExpressions() {
        console.log('🧪 TESTING FORM FACTOR EXPRESSIONS\n');
        console.log('═════════════════════════════════════\n');

        // Find a match with populated data
        const populatedMatch = this.allMatches.find(match => 
            (match.timeSeries?.home?.matchesPlayed || 0) > 0 &&
            (match.timeSeries?.away?.matchesPlayed || 0) > 0
        );

        if (!populatedMatch) {
            console.log('❌ No matches found with populated timeSeries data');
            return;
        }

        console.log(`Testing with match: ${populatedMatch.match?.homeTeam} vs ${populatedMatch.match?.awayTeam}\n`);

        const testExpressions = [
            'timeSeries.home.matchesPlayed || 0',
            'timeSeries.away.matchesPlayed || 0',
            'timeSeries.home.streaks.overall.current.count || 0',
            'timeSeries.away.streaks.overall.current.count || 0',
            'timeSeries.home.cumulative.overall.goalDifference || 0',
            'timeSeries.away.cumulative.overall.goalDifference || 0',
            'timeSeries.home.cumulative.markets.asianHandicapWinRate || 0',
            'timeSeries.away.cumulative.markets.asianHandicapWinRate || 0',
            '(timeSeries.home.streaks.overall.current.count || 0) - (timeSeries.away.streaks.overall.current.count || 0)',
            '(timeSeries.home.cumulative.overall.goalDifference || 0) - (timeSeries.away.cumulative.overall.goalDifference || 0)'
        ];

        testExpressions.forEach(expression => {
            try {
                const context = {
                    match: populatedMatch.match,
                    fbref: populatedMatch.fbref,
                    enhanced: populatedMatch.enhanced,
                    timeSeries: populatedMatch.timeSeries,
                    parseFloat: parseFloat,
                    Math: Math
                };

                const result = Function('match', 'fbref', 'enhanced', 'timeSeries', 'parseFloat', 'Math', 
                    `"use strict"; return ${expression}`)(
                    context.match, context.fbref, context.enhanced, context.timeSeries,
                    context.parseFloat, context.Math
                );

                console.log(`✅ ${expression}`);
                console.log(`   Result: ${result}\n`);
            } catch (error) {
                console.log(`❌ ${expression}`);
                console.log(`   Error: ${error.message}\n`);
            }
        });
    }

    findDataAvailabilityByWeek() {
        console.log('📅 DATA AVAILABILITY BY WEEK\n');
        console.log('═══════════════════════════════\n');

        const weekStats = {};
        
        this.allMatches.forEach(match => {
            const week = parseInt(match.fbref?.week || 0);
            const homeMatches = match.timeSeries?.home?.matchesPlayed || 0;
            const awayMatches = match.timeSeries?.away?.matchesPlayed || 0;
            
            if (!weekStats[week]) {
                weekStats[week] = {
                    total: 0,
                    withData: 0,
                    avgHomeMatches: 0,
                    avgAwayMatches: 0
                };
            }
            
            weekStats[week].total++;
            if (homeMatches > 0 || awayMatches > 0) {
                weekStats[week].withData++;
            }
            weekStats[week].avgHomeMatches += homeMatches;
            weekStats[week].avgAwayMatches += awayMatches;
        });

        // Calculate averages
        Object.values(weekStats).forEach(stats => {
            stats.avgHomeMatches = stats.avgHomeMatches / stats.total;
            stats.avgAwayMatches = stats.avgAwayMatches / stats.total;
        });

        console.log('Week | Total | With Data | % Coverage | Avg Home | Avg Away');
        console.log('-----|-------|-----------|-----------|----------|----------');
        
        for (let week = 1; week <= 38; week++) {
            const stats = weekStats[week];
            if (stats) {
                const coverage = (stats.withData / stats.total * 100).toFixed(1);
                console.log(
                    `${week.toString().padStart(4)} | ` +
                    `${stats.total.toString().padStart(5)} | ` +
                    `${stats.withData.toString().padStart(9)} | ` +
                    `${coverage.padStart(8)}% | ` +
                    `${stats.avgHomeMatches.toFixed(1).padStart(8)} | ` +
                    `${stats.avgAwayMatches.toFixed(1).padStart(8)}`
                );
            }
        }

        console.log('\n🎯 RECOMMENDATIONS:\n');
        console.log('• Form/streak strategies should focus on matches from week 5+ onwards');
        console.log('• Early season matches (weeks 1-4) have insufficient historical data');
        console.log('• Peak data availability should be around mid-season');
        console.log('• Consider minimum matchesPlayed thresholds for reliable form data\n');
    }
}

if (require.main === module) {
    const formDebugger = new DebugFormData();
    formDebugger.analyzeTimeSeriesStructure();
    formDebugger.testFormFactorExpressions();
    formDebugger.findDataAvailabilityByWeek();
}

module.exports = DebugFormData;