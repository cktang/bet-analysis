const fs = require('fs');

console.log('📊 EXPORTING HOME ADVANTAGE QUARTER HANDICAP BETTING RECORDS');
console.log('='.repeat(80));
console.log('🎯 Creating betting records file for report/index.html viewing');
console.log('🔧 Updated to include actual stake amounts and correct ROI calculation');
console.log('');

// Load data
const data2022 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2022-2023-enhanced.json', 'utf8'));
const data2023 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2023-2024-enhanced.json', 'utf8'));  
const data2024 = JSON.parse(fs.readFileSync('../../data/enhanced/year-2024-2025-enhanced.json', 'utf8'));

const allMatches = [
    ...Object.values(data2022.matches || {}),
    ...Object.values(data2023.matches || {}),
    ...Object.values(data2024.matches || {})
];

// Simple stake calculation
function calculateSimpleStake(odds) {
    const baseOdds = 1.91;
    const baseStake = 200;
    const increment = 150;
    
    if (odds < baseOdds) return baseStake;
    
    const steps = Math.round((odds - baseOdds) / 0.01);
    return baseStake + (steps * increment);
}

// Helper functions
function isQuarterHandicap(handicap) {
    const singlePatterns = [
        '0', '-0.5', '+0.5', '-1', '+1', '-1.5', '+1.5', '-2', '+2', '-2.5', '+2.5', '-3', '+3'
    ];
    
    if (singlePatterns.includes(handicap)) {
        return false;
    }
    
    if (handicap.includes('/')) {
        return true;
    }
    
    return false;
}

function homeHasAdvantage(handicap) {
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        return h1 < 0 && h2 < 0;
    }
    return false;
}

function calculateAHResult(homeScore, awayScore, handicap, betSide) {
    if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') {
        return null;
    }
    
    const scoreDiff = homeScore - awayScore;
    const adjustedDiff = betSide === 'home' ? scoreDiff : -scoreDiff;
    
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        const result1 = adjustedDiff > h1 ? 'win' : (adjustedDiff === h1 ? 'push' : 'lose');
        const result2 = adjustedDiff > h2 ? 'win' : (adjustedDiff === h2 ? 'push' : 'lose');
        
        if (result1 === 'win' && result2 === 'win') return 'win';
        if (result1 === 'lose' && result2 === 'lose') return 'lose';
        if ((result1 === 'win' && result2 === 'push') || (result1 === 'push' && result2 === 'win')) return 'half-win';
        if ((result1 === 'lose' && result2 === 'push') || (result1 === 'push' && result2 === 'lose')) return 'half-lose';
        return 'push';
    }
    
    return null;
}

function getIndividualQuarterResults(homeScore, awayScore, handicap, betSide) {
    const scoreDiff = homeScore - awayScore;
    const adjustedDiff = betSide === 'home' ? scoreDiff : -scoreDiff;
    
    if (handicap.includes('/')) {
        const parts = handicap.split('/');
        const h1 = parseFloat(parts[0]);
        const h2 = parseFloat(parts[1]);
        
        const result1 = adjustedDiff > h1 ? 'Win' : (adjustedDiff === h1 ? 'Push' : 'Loss');
        const result2 = adjustedDiff > h2 ? 'Win' : (adjustedDiff === h2 ? 'Push' : 'Loss');
        
        return [result1, result2];
    }
    
    return ['Unknown', 'Unknown'];
}

// Generate betting records with actual stakes
function generateBettingRecords() {
    const bettingRecords = [];
    let totalProfit = 0;
    let totalStaked = 0; // Now track actual stakes
    let totalBets = 0;
    let wins = 0;
    let halfWins = 0;
    
    console.log('Processing home advantage quarter handicap matches...');
    
    allMatches.forEach(match => {
        const ah = match.preMatch?.match?.asianHandicapOdds;
        const matchInfo = match.preMatch?.match;
        
        if (!ah?.homeHandicap || !matchInfo) return;
        if (!isQuarterHandicap(ah.homeHandicap)) return;
        if (!homeHasAdvantage(ah.homeHandicap)) return;
        if (!ah.homeOdds || !ah.awayOdds) return;
        if (typeof matchInfo.homeScore === 'undefined') return;
        
        const higherOdds = Math.max(ah.homeOdds, ah.awayOdds);
        const betSide = ah.homeOdds > ah.awayOdds ? 'Home' : 'Away';
        const betSideKey = ah.homeOdds > ah.awayOdds ? 'home' : 'away';
        
        const stake = calculateSimpleStake(higherOdds);
        const betResult = calculateAHResult(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSideKey);
        
        if (!betResult) return;
        
        let profit = 0;
        let outcome = '';
        
        if (betResult === 'win') {
            profit = stake * (higherOdds - 1);
            outcome = 'Win';
            wins++;
        } else if (betResult === 'half-win') {
            profit = stake * (higherOdds - 1) / 2;
            outcome = 'Half Win';
            halfWins++;
        } else if (betResult === 'push') {
            profit = 0;
            outcome = 'Push';
        } else if (betResult === 'half-lose') {
            profit = -stake / 2;
            outcome = 'Half Loss';
        } else {
            profit = -stake;
            outcome = 'Loss';
        }
        
        totalProfit += profit;
        totalStaked += stake; // Add actual stake to total
        totalBets++;
        
        // Get individual quarter results for detailed breakdown
        const individualResults = getIndividualQuarterResults(matchInfo.homeScore, matchInfo.awayScore, ah.homeHandicap, betSideKey);
        const handicapParts = ah.homeHandicap.split('/').map(h => parseFloat(h));
        
        const record = {
            date: new Date(matchInfo.date || '2023-01-01').toISOString(),
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            score: `${matchInfo.homeScore}-${matchInfo.awayScore}`,
            handicapLine: ah.homeHandicap,
            betSide: betSide,
            betOdds: higherOdds.toFixed(2),
            betSize: stake.toString(), // ADD ACTUAL STAKE AMOUNT
            profit: Math.round(profit).toString(),
            outcome: outcome,
            factorValue: higherOdds.toFixed(4),
            factorCalculation: [
                {
                    factorIndex: 1,
                    expression: "homeHasAdvantage(handicap) && isQuarterHandicap(handicap)",
                    calculatedValue: "true",
                    explanation: `Home advantage quarter handicap: ${ah.homeHandicap}`
                },
                {
                    factorIndex: 2,
                    expression: "$150 increment per 0.01 odds above 1.91",
                    calculatedValue: stake.toString(),
                    explanation: `Stake: $${stake} (odds: ${higherOdds.toFixed(2)}, steps: ${Math.round((higherOdds - 1.91) / 0.01)})`
                },
                {
                    factorIndex: 3,
                    expression: "Math.max(homeOdds, awayOdds)",
                    calculatedValue: higherOdds.toString(),
                    explanation: `Higher odds side: ${betSide} (${higherOdds.toFixed(2)} vs ${betSide === 'Home' ? ah.awayOdds.toFixed(2) : ah.homeOdds.toFixed(2)})`
                }
            ],
            threshold: "home_advantage_quarter",
            thresholdType: "Fixed Filter (Home Advantage Quarter)",
            thresholdMet: true,
            factors: [
                "homeHasAdvantage(handicap)",
                "isQuarterHandicap(handicap)",
                "$150 increment steepness"
            ],
            strategyCorrelation: "N/A",
            handicapDetails: {
                splitLines: handicapParts,
                individualOutcomes: individualResults,
                betPerLine: Math.round(stake / 2)
            }
        };
        
        bettingRecords.push(record);
    });
    
    // Calculate correct ROI using actual total stakes
    const correctROI = ((totalProfit / totalStaked) * 100).toFixed(2);
    const winRate = ((wins + halfWins * 0.5) / totalBets * 100).toFixed(1);
    
    console.log(`Generated ${bettingRecords.length} betting records`);
    console.log(`Total staked (actual): $${totalStaked.toFixed(0)}`);
    console.log(`Total profit: $${totalProfit.toFixed(0)}`);
    console.log(`Correct ROI: ${correctROI}%`);
    console.log(`Win rate: ${winRate}%`);
    
    return {
        bettingRecords,
        totalBets,
        totalStaked: Math.round(totalStaked),
        totalProfit: Math.round(totalProfit),
        correctROI: `${correctROI}%`,
        winRate: `${winRate}%`
    };
}

// Create the complete betting records file with corrected data
function createBettingRecordsFile() {
    const { bettingRecords, totalBets, totalStaked, totalProfit, correctROI, winRate } = generateBettingRecords();
    
    const exportData = {
        strategy: {
            name: "Home_Advantage_Quarter_Handicap_150_Increment",
            roi: correctROI, // Use correct ROI
            correlation: "N/A",
            factors: [
                "homeHasAdvantage(handicap)",
                "isQuarterHandicap(handicap)", 
                "$150 increment per 0.01 odds above 1.91"
            ],
            hypothesis: "Home advantage quarter handicaps create trapped pricing inefficiencies. Betting higher odds side with aggressive steepness captures systematic edge when home teams give handicaps (-0.5/-1, -1/-1.5, etc.)",
            error: null
        },
        summary: {
            totalBets: totalBets,
            totalStaked: totalStaked, // Include actual total staked
            totalProfit: totalProfit,
            winRate: winRate,
            roi: correctROI, // Include ROI in summary too
            generatedAt: new Date().toISOString()
        },
        bettingRecords: bettingRecords
    };
    
    // Write to results directory
    const filename = 'Home_Advantage_Quarter_Handicap_150_Increment_betting_records.json';
    const outputPath = `results/${filename}`;
    
    try {
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
        console.log(`\n✅ Successfully exported updated betting records to: ${outputPath}`);
        console.log(`📊 Records: ${totalBets} bets, $${totalStaked} staked, $${totalProfit} profit`);
        console.log(`📈 Correct ROI: ${correctROI}, Win Rate: ${winRate}`);
        console.log(`🌐 View in report: Open report/index.html and look for "${filename}"`);
        
        return { outputPath, correctROI, totalStaked, totalProfit, totalBets };
    } catch (error) {
        console.error('❌ Error writing file:', error.message);
        return null;
    }
}

// Run the export
const result = createBettingRecordsFile();

if (result) {
    console.log('\n🎯 UPDATED BETTING RECORDS EXPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log('✅ Each bet record now includes actual stake amount in "betSize" field');
    console.log('✅ ROI calculation corrected using actual total stakes');
    console.log('📋 Next step: Update summary.json with correct ROI');
    console.log('');
    console.log('🔍 VERIFICATION DATA:');
    console.log(`   Total Staked: $${result.totalStaked}`);
    console.log(`   Total Profit: $${result.totalProfit}`);
    console.log(`   Correct ROI: ${result.correctROI}`);
    console.log(`   Total Bets: ${result.totalBets}`);
}

console.log('\n✅ Export complete!'); 