const fs = require('fs');
const path = require('path');

console.log('📊 EXTRACTING BETTING RECORDS FOR ALL CURRENT STRATEGIES');
console.log('========================================================');

const resultsPath = '../../data/processed/ah_analysis_results.json';
const enhancedDataPath = '../../data/enhanced';

if (!fs.existsSync(resultsPath)) {
    console.error('❌ Analysis results file not found!');
    process.exit(1);
}

console.log('📁 Loading analysis results and match data...');

// Load analysis results
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Load all enhanced match data
const allMatches = [];
const seasons = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];

seasons.forEach(season => {
    const seasonPath = path.join(enhancedDataPath, season);
    if (fs.existsSync(seasonPath)) {
        const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
        const matches = Object.values(seasonData.matches);
        allMatches.push(...matches);
        console.log(`Loaded ${matches.length} matches from ${season}`);
    }
});

// Filter matches with complete data
const validMatches = allMatches.filter(match => 
    match.postMatch?.asianHandicapResults &&
    match.preMatch?.match?.asianHandicapOdds &&
    match.timeSeries?.home && match.timeSeries?.away
);

console.log(`Total valid matches: ${validMatches.length}`);

// Get latest iteration strategies
const latestIteration = data.iterations[data.iterations.length - 1];
const strategies = latestIteration.results || [];

console.log(`Found ${strategies.length} strategies to extract betting records for`);

// Create betting records directory
const recordsDir = './current_betting_records';
if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
}

// Function to evaluate factor value for a match
function evaluateValue(match, factorExpression) {
    try {
        const context = {
            match: match.preMatch?.match,
            fbref: match.preMatch?.fbref,
            enhanced: match.preMatch?.enhanced,
            timeSeries: match.timeSeries,
            preMatch: match.preMatch,
            postMatch: match.postMatch,
            parseFloat: parseFloat,
            Math: Math
        };

        return Function('match', 'fbref', 'enhanced', 'timeSeries', 'preMatch', 'postMatch', 'parseFloat', 'Math', 
            `"use strict"; return ${factorExpression}`)(
            context.match, context.fbref, context.enhanced, context.timeSeries,
            context.preMatch, context.postMatch, context.parseFloat, context.Math
        );
    } catch (error) {
        return null;
    }
}

// Function to extract betting records for a strategy
function extractBettingRecords(strategy) {
    console.log(`\n🔍 Extracting records for: ${strategy.name}`);
    
    const matchData = [];
    
    // Evaluate each match for this strategy
    validMatches.forEach(match => {
        const factorValues = [];
        let validMatch = true;

        // Calculate all factor values
        strategy.factors.forEach(factor => {
            const value = evaluateValue(match, factor);
            if (value === null || isNaN(value) || !isFinite(value)) {
                validMatch = false;
            }
            factorValues.push(value);
        });

        if (validMatch) {
            // Combine factor values
            const combinedValue = factorValues.length === 1 ? 
                factorValues[0] : 
                factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;

            // Get match details
            const homeTeam = match.preMatch?.match?.homeTeam || 'Unknown';
            const awayTeam = match.preMatch?.match?.awayTeam || 'Unknown';
            const matchDate = match.preMatch?.match?.date || 'Unknown';
            
            // Get actual match scores (not the incorrect preMatch scores)
            let homeScore = 0;
            let awayScore = 0;
            
            // Try FBRef data first (most accurate)
            if (match.postMatch?.fbrefIncidents?.homeScore !== undefined && match.postMatch?.fbrefIncidents?.awayScore !== undefined) {
                homeScore = match.postMatch.fbrefIncidents.homeScore;
                awayScore = match.postMatch.fbrefIncidents.awayScore;
            }
            // Fallback to actualResults
            else if (match.postMatch?.actualResults?.homeGoals !== undefined && match.postMatch?.actualResults?.awayGoals !== undefined) {
                homeScore = match.postMatch.actualResults.homeGoals || 0;
                awayScore = match.postMatch.actualResults.awayGoals || 0;
            }
            // Last resort: use preMatch (but these might be wrong)
            else {
                homeScore = match.preMatch?.match?.homeScore || 0;
                awayScore = match.preMatch?.match?.awayScore || 0;
            }
            
            // Get Asian Handicap details
            const ahOdds = match.preMatch?.match?.asianHandicapOdds;
            const ahResults = match.postMatch?.asianHandicapResults;
            const handicapLine = ahOdds?.homeHandicap || '0';
            
            if (ahOdds && ahResults) {
                // Map the actual handicap line to the correct AH result
                let mainAhResult = 'draw';
                const handicapValue = ahOdds.homeHandicap;
                
                // Extract numeric handicap value for mapping
                let numericHandicap = 0;
                if (typeof handicapValue === 'string') {
                    if (handicapValue.includes('/')) {
                        // Handle split handicaps like "0/-0.5" or "+1/+1.5"
                        const parts = handicapValue.split('/');
                        numericHandicap = parseFloat(parts[0].replace('+', ''));
                    } else {
                        numericHandicap = parseFloat(handicapValue.replace('+', ''));
                    }
                }
                
                // Find the closest AH result key
                const ahKeys = Object.keys(ahResults);
                let closestKey = 'ah_0';
                let minDiff = Math.abs(0 - numericHandicap);
                
                ahKeys.forEach(key => {
                    if (key.startsWith('ah_')) {
                        const keyValue = parseFloat(key.replace('ah_', ''));
                        const diff = Math.abs(keyValue - numericHandicap);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestKey = key;
                        }
                    }
                });
                
                mainAhResult = ahResults[closestKey] || ahResults.ah_0 || Object.values(ahResults)[0];
                
                let homeProfit = 0;
                let awayProfit = 0;
                
                if (mainAhResult === 'home') {
                    homeProfit = (ahOdds.homeOdds - 1) * 100;
                    awayProfit = -100;
                } else if (mainAhResult === 'away') {
                    homeProfit = -100;
                    awayProfit = (ahOdds.awayOdds - 1) * 100;
                } else if (mainAhResult === 'draw') {
                    homeProfit = 0;
                    awayProfit = 0;
                }

                matchData.push({
                    combinedValue,
                    homeTeam,
                    awayTeam,
                    matchDate,
                    homeScore,
                    awayScore,
                    handicapLine,
                    homeOdds: ahOdds.homeOdds,
                    awayOdds: ahOdds.awayOdds,
                    ahResult: mainAhResult,
                    homeProfit,
                    awayProfit
                });
            }
        }
    });

    if (matchData.length === 0) {
        console.log(`   ⚠️ No valid matches found for ${strategy.name}`);
        return;
    }

    // Apply strategy logic to determine bets
    const bettingRecords = [];
    
    // Use the same threshold logic as the original strategy
    const thresholdPercent = strategy.strategy?.thresholdPercent || 15;
    const topCount = Math.floor(matchData.length * (thresholdPercent / 100));
    const bottomCount = Math.floor(matchData.length * (thresholdPercent / 100));
    
    // Sort by combined value
    const sortedMatches = [...matchData].sort((a, b) => b.combinedValue - a.combinedValue);
    
    // Top matches - bet HOME
    const topMatches = sortedMatches.slice(0, topCount);
    topMatches.forEach(match => {
        bettingRecords.push({
            ...match,
            betSide: 'HOME',
            betOdds: match.homeOdds,
            profit: match.homeProfit,
            result: match.homeProfit > 0 ? 'WIN' : match.homeProfit < 0 ? 'LOSS' : 'PUSH'
        });
    });
    
    // Bottom matches - bet AWAY  
    const bottomMatches = sortedMatches.slice(-bottomCount);
    bottomMatches.forEach(match => {
        bettingRecords.push({
            ...match,
            betSide: 'AWAY',
            betOdds: match.awayOdds,
            profit: match.awayProfit,
            result: match.awayProfit > 0 ? 'WIN' : match.awayProfit < 0 ? 'LOSS' : 'PUSH'
        });
    });

    if (bettingRecords.length === 0) {
        console.log(`   ⚠️ No bets generated for ${strategy.name}`);
        return;
    }

    // Sort by date
    bettingRecords.sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));

    console.log(`   ✅ Generated ${bettingRecords.length} betting records`);

    // Create CSV file
    const csvHeaders = [
        'Date', 'HomeTeam', 'AwayTeam', 'Score', 'HandicapLine', 'BetSide', 
        'BetOdds', 'Profit', 'Result', 'FactorValue', 'FactorComponents', 'AHResult'
    ];
    
    const csvRows = bettingRecords.map(record => {
        // Calculate individual factor components for this record
        let factorComponents = 'N/A';
        if (strategy.factors && strategy.factors.length > 0) {
            const components = [];
            strategy.factors.forEach((factor, index) => {
                // Try to evaluate the factor again to get component details
                try {
                    const match = validMatches.find(m => 
                        m.preMatch?.match?.homeTeam === record.homeTeam &&
                        m.preMatch?.match?.awayTeam === record.awayTeam &&
                        m.preMatch?.match?.date === record.matchDate
                    );
                    
                    if (match) {
                        const value = evaluateValue(match, factor);
                        components.push(`F${index + 1}:${value}`);
                        
                        // Add specific details for common factor patterns
                        if (factor.includes('leaguePosition')) {
                            const homePos = match.timeSeries?.home?.leaguePosition || 20;
                            const awayPos = match.timeSeries?.away?.leaguePosition || 20;
                            components[components.length - 1] += `(Away:${awayPos}-Home:${homePos})`;
                        }
                        if (factor.includes('goalDifference')) {
                            const homeGD = match.timeSeries?.home?.goalDifference || 0;
                            const awayGD = match.timeSeries?.away?.goalDifference || 0;
                            components[components.length - 1] += `(Home:${homeGD},Away:${awayGD})`;
                        }
                        if (factor.includes('Streak')) {
                            const homeStreak = match.timeSeries?.home?.currentStreak || 0;
                            const awayStreak = match.timeSeries?.away?.currentStreak || 0;
                            components[components.length - 1] += `(Home:${homeStreak},Away:${awayStreak})`;
                        }
                    }
                } catch (error) {
                    components.push(`F${index + 1}:ERROR`);
                }
            });
            factorComponents = components.join('|');
        }
        
        return [
            record.matchDate,
            record.homeTeam,
            record.awayTeam,
            `${record.homeScore}-${record.awayScore}`,
            record.handicapLine,
            record.betSide,
            record.betOdds.toFixed(3),
            record.profit.toFixed(2),
            record.result,
            record.combinedValue.toFixed(4),
            factorComponents,
            record.ahResult
        ];
    });

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    
    // Clean strategy name for filename
    const cleanName = strategy.name.replace(/[^a-zA-Z0-9]/g, '_');
    const csvPath = path.join(recordsDir, `${cleanName}_bets.csv`);
    fs.writeFileSync(csvPath, csvContent);

    // Create JSON summary
    const totalBets = bettingRecords.length;
    const wins = bettingRecords.filter(r => r.result === 'WIN').length;
    const losses = bettingRecords.filter(r => r.result === 'LOSS').length;
    const pushes = bettingRecords.filter(r => r.result === 'PUSH').length;
    const totalProfit = bettingRecords.reduce((sum, r) => sum + r.profit, 0);
    const totalInvestment = totalBets * 100;
    const roi = (totalProfit / totalInvestment) * 100;
    const winRate = (wins / totalBets) * 100;

    const summary = {
        strategyName: strategy.name,
        strategyType: strategy.type,
        factors: strategy.factors,
        hypothesis: strategy.hypothesis,
        performance: {
            totalBets,
            wins,
            losses,
            pushes,
            winRate: winRate.toFixed(2) + '%',
            totalInvestment,
            totalProfit: totalProfit.toFixed(2),
            roi: roi.toFixed(2) + '%',
            avgProfitPerBet: (totalProfit / totalBets).toFixed(2)
        },
        bettingDetails: {
            thresholdUsed: `${thresholdPercent}% (top/bottom)`,
            homeBets: bettingRecords.filter(r => r.betSide === 'HOME').length,
            awayBets: bettingRecords.filter(r => r.betSide === 'AWAY').length,
            selectionRate: ((totalBets / matchData.length) * 100).toFixed(1) + '%'
        },
        records: bettingRecords
    };

    const jsonPath = path.join(recordsDir, `${cleanName}_summary.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

    console.log(`   📄 CSV: ${csvPath}`);
    console.log(`   📄 JSON: ${jsonPath}`);
    console.log(`   💰 ROI: ${roi.toFixed(2)}%, Win Rate: ${winRate.toFixed(1)}%`);

    return summary;
}

// Extract records for all strategies
console.log('\n🚀 Starting betting record extraction...');

const allSummaries = [];
let successCount = 0;

strategies.forEach((strategy, index) => {
    try {
        const summary = extractBettingRecords(strategy);
        if (summary) {
            allSummaries.push(summary);
            successCount++;
        }
    } catch (error) {
        console.log(`   ❌ Error extracting ${strategy.name}: ${error.message}`);
    }
});

// Create master summary
const masterSummary = {
    generatedAt: new Date().toISOString(),
    totalStrategies: strategies.length,
    successfulExtractions: successCount,
    strategies: allSummaries.map(s => ({
        name: s.strategyName,
        roi: s.performance.roi,
        totalBets: s.performance.totalBets,
        winRate: s.performance.winRate
    }))
};

fs.writeFileSync(path.join(recordsDir, '_MASTER_SUMMARY.json'), JSON.stringify(masterSummary, null, 2));

// Create README
const readmeContent = `# Current Betting Records

## 📊 Summary

- **Total Strategies**: ${strategies.length}
- **Successful Extractions**: ${successCount}
- **Generated**: ${new Date().toISOString()}

## 📁 Files

Each strategy has two files:
- **\`StrategyName_bets.csv\`**: Individual betting records with match details
- **\`StrategyName_summary.json\`**: Complete performance summary and all records

## 📋 CSV Format

\`\`\`
Date,HomeTeam,AwayTeam,Score,HandicapLine,BetSide,BetOdds,Profit,Result,FactorValue,FactorComponents,AHResult
\`\`\`

## 💰 Top 10 Strategies by ROI

${allSummaries
    .sort((a, b) => parseFloat(b.performance.roi) - parseFloat(a.performance.roi))
    .slice(0, 10)
    .map((s, i) => `${i+1}. **${s.strategyName}**: ${s.performance.roi} (${s.performance.totalBets} bets)`)
    .join('\n')}

## ⚠️ Important Notes

- All betting records are for **Asian Handicap** betting
- Profits calculated based on handicap coverage, not match results
- Each bet is 100 units, profits shown as actual profit/loss
- WIN/LOSS/PUSH based on Asian Handicap outcomes only

*Generated by extract_all_current_betting_records.js*
`;

fs.writeFileSync(path.join(recordsDir, 'README.md'), readmeContent);

console.log('\n✅ BETTING RECORD EXTRACTION COMPLETE!');
console.log(`📁 Records saved to: ${path.resolve(recordsDir)}`);
console.log(`📊 Successfully extracted records for ${successCount}/${strategies.length} strategies`);
console.log(`📄 Files: ${successCount * 2} CSV/JSON files + master summary + README`);
console.log('\n📋 Access betting records at:');
console.log(`   ${path.resolve(recordsDir)}/`);
console.log('\n🎯 Each strategy now has detailed betting records for validation!');
