const fs = require('fs');
const path = require('path');

// Load all strategies data
const strategiesData = JSON.parse(fs.readFileSync('all_strategies_sorted.json', 'utf8'));

// Create output directory
const outputDir = 'winning_strategies_records';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Define winning strategies (positive profitability only)
const winningStrategies = strategiesData.filter(strategy => strategy.profitability > 0);

console.log(`Found ${winningStrategies.length} winning strategies out of ${strategiesData.length} total strategies`);

// Load match data to extract individual betting records
let matchData;
try {
    // Try to load enhanced data first
    const enhancedFiles = [
        '../../data/enhanced/year-2024-2025-enhanced.json',
        '../../data/enhanced/year-2023-2024-enhanced.json',
        '../../data/processed/year-2024-2025.json',
        '../../data/processed/year-2023-2024.json',
        '../../data/processed/year-2022-2023.json'
    ];
    
    matchData = [];
    for (const file of enhancedFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            
            // Handle different data structures
            if (Array.isArray(data)) {
                matchData = matchData.concat(data);
                console.log(`Loaded ${data.length} matches from ${file}`);
            } else if (data.matches) {
                // Enhanced data format with matches object
                const matches = Object.values(data.matches);
                matchData = matchData.concat(matches);
                console.log(`Loaded ${matches.length} matches from ${file}`);
            } else if (data.data && Array.isArray(data.data)) {
                matchData = matchData.concat(data.data);
                console.log(`Loaded ${data.data.length} matches from ${file}`);
            } else {
                console.log(`Unknown data structure in ${file}`);
            }
        } catch (error) {
            console.log(`Could not load ${file}: ${error.message}`);
        }
    }
    
    console.log(`Total match data loaded: ${matchData.length} matches`);
    
} catch (error) {
    console.error('Could not load match data:', error.message);
    process.exit(1);
}

// Function to safely evaluate factor expression
function evaluateFactor(factor, match) {
    try {
        // Create a safe context with match data
        const context = {
            timeSeries: match.timeSeries || {},
            fbref: match.fbref || {},
            match: match,
            enhanced: match.enhanced || {}
        };
        
        // Replace undefined values with safe defaults
        const safeExpression = factor
            .replace(/\|\|\s*0/g, ' || 0')
            .replace(/\|\|\s*20/g, ' || 20');
        
        // Use Function constructor for safe evaluation
        const func = new Function('timeSeries', 'fbref', 'match', 'enhanced', `return ${safeExpression}`);
        return func(context.timeSeries, context.fbref, context.match, context.enhanced);
        
    } catch (error) {
        return null;
    }
}

// Function to determine bet choice based on strategy
function determineBetChoice(strategy, match, factorValues) {
    // For single factor strategies
    if (strategy.type === 'single' || strategy.type === 'stakes_analysis' || strategy.type === 'adaptive_ratio') {
        const factorValue = factorValues[0];
        
        if (factorValue === null || factorValue === undefined) return null;
        
        // Calculate threshold based on all matches
        const allValues = matchData.map(m => evaluateFactor(strategy.factors[0], m))
            .filter(v => v !== null && v !== undefined && !isNaN(v));
        
        if (allValues.length === 0) return null;
        
        allValues.sort((a, b) => a - b);
        const thresholdPercent = strategy.strategy?.thresholdPercent || 15;
        const lowerIndex = Math.floor(allValues.length * (thresholdPercent / 100));
        const upperIndex = Math.floor(allValues.length * (1 - thresholdPercent / 100));
        
        const lowerThreshold = allValues[lowerIndex];
        const upperThreshold = allValues[upperIndex];
        
        if (factorValue <= lowerThreshold) {
            return 'AWAY';
        } else if (factorValue >= upperThreshold) {
            return 'HOME';
        }
        return null;
    }
    
    // For multi-factor strategies
    if (strategy.factors.length > 1) {
        // Simple combined approach for multi-factor
        const validValues = factorValues.filter(v => v !== null && v !== undefined);
        if (validValues.length === 0) return null;
        
        const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        return average > 0.5 ? 'HOME' : 'AWAY';
    }
    
    return null;
}

// Function to calculate profit based on bet choice and outcome
function calculateProfit(betChoice, match, betAmount = 100) {
    if (!betChoice || !match.enhanced?.preMatch?.asianHandicap) return 0;
    
    const ah = match.enhanced.preMatch.asianHandicap;
    const homeScore = match.fbref?.homeScore || 0;
    const awayScore = match.fbref?.awayScore || 0;
    
    let actualOutcome;
    const handicap = ah.homeHandicap || 0;
    const adjustedHomeScore = homeScore + handicap;
    
    if (adjustedHomeScore > awayScore) {
        actualOutcome = 'HOME';
    } else if (adjustedHomeScore < awayScore) {
        actualOutcome = 'AWAY';
    } else {
        actualOutcome = 'DRAW';
    }
    
    if (betChoice === actualOutcome) {
        const odds = betChoice === 'HOME' ? (ah.homeOdds || 1.9) : (ah.awayOdds || 1.9);
        return betAmount * (odds - 1);
    } else if (actualOutcome === 'DRAW') {
        return 0; // Push in Asian Handicap
    } else {
        return -betAmount;
    }
}

// Process each winning strategy
winningStrategies.forEach((strategy, index) => {
    console.log(`\nProcessing ${index + 1}/${winningStrategies.length}: ${strategy.name} (${(strategy.profitability * 100).toFixed(2)}% profit)`);
    
    const bettingRecords = [];
    let totalBets = 0;
    let totalProfit = 0;
    let winningBets = 0;
    
    matchData.forEach(match => {
        try {
            // Evaluate all factors for this match
            const factorValues = strategy.factors.map(factor => evaluateFactor(factor, match));
            
            // Determine bet choice
            const betChoice = determineBetChoice(strategy, match, factorValues);
            
            if (betChoice) {
                const profit = calculateProfit(betChoice, match);
                const isWin = profit > 0;
                
                totalBets++;
                totalProfit += profit;
                if (isWin) winningBets++;
                
                bettingRecords.push({
                    date: match.fbref?.date || match.date || 'Unknown',
                    homeTeam: match.fbref?.homeTeam || match.homeTeam || 'Unknown',
                    awayTeam: match.fbref?.awayTeam || match.awayTeam || 'Unknown',
                    homeScore: match.fbref?.homeScore || 0,
                    awayScore: match.fbref?.awayScore || 0,
                    betChoice: betChoice,
                    profit: profit,
                    isWin: isWin,
                    factorValues: factorValues,
                    homeOdds: match.enhanced?.preMatch?.asianHandicap?.homeOdds || 1.9,
                    awayOdds: match.enhanced?.preMatch?.asianHandicap?.awayOdds || 1.9,
                    handicap: match.enhanced?.preMatch?.asianHandicap?.homeHandicap || 0,
                    decisionLogic: `Factors: [${factorValues.map(v => typeof v === 'number' ? v.toFixed(3) : v).join(', ')}] → BET ${betChoice}`
                });
            }
        } catch (error) {
            // Skip matches with errors
        }
    });
    
    // Generate summary
    const summary = {
        metadata: {
            generatedAt: new Date().toISOString(),
            strategy: {
                name: strategy.name,
                factors: strategy.factors,
                type: strategy.type,
                hypothesis: strategy.hypothesis,
                profitabilityReported: (strategy.profitability * 100).toFixed(2) + '%'
            }
        },
        performance: {
            totalBets: totalBets,
            winningBets: winningBets,
            totalProfit: totalProfit,
            accuracy: totalBets > 0 ? (winningBets / totalBets * 100).toFixed(2) + '%' : '0%',
            profitability: totalBets > 0 ? (totalProfit / (totalBets * 100) * 100).toFixed(2) + '%' : '0%',
            avgProfitPerBet: totalBets > 0 ? (totalProfit / totalBets).toFixed(2) : '0'
        },
        originalStrategyData: {
            correlation: strategy.correlation,
            originalProfitability: strategy.profitability,
            originalSampleSize: strategy.validSamples,
            originalTotalBets: strategy.strategy?.totalBets
        }
    };
    
    // Write summary JSON
    const summaryFile = path.join(outputDir, `${strategy.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_summary.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    // Write detailed CSV
    if (bettingRecords.length > 0) {
        const csvHeaders = [
            'Date', 'Home Team', 'Away Team', 'Home Score', 'Away Score',
            'Bet Choice', 'Profit', 'Is Win', 'Decision Logic',
            'Home Odds', 'Away Odds', 'Handicap'
        ];
        
        const csvData = bettingRecords.map(record => [
            record.date,
            record.homeTeam,
            record.awayTeam,
            record.homeScore,
            record.awayScore,
            record.betChoice,
            record.profit,
            record.isWin,
            record.decisionLogic,
            record.homeOdds,
            record.awayOdds,
            record.handicap
        ]);
        
        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        const csvFile = path.join(outputDir, `${strategy.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_bets.csv`);
        fs.writeFileSync(csvFile, csvContent);
    }
    
    console.log(`  Generated ${totalBets} betting records with ${(totalProfit / (totalBets * 100) * 100).toFixed(2)}% profitability`);
});

// Generate master summary
const masterSummary = {
    generatedAt: new Date().toISOString(),
    totalWinningStrategies: winningStrategies.length,
    strategies: winningStrategies.map((strategy, index) => ({
        rank: index + 1,
        name: strategy.name,
        profitability: (strategy.profitability * 100).toFixed(2) + '%',
        correlation: strategy.correlation?.toFixed(4),
        sampleSize: strategy.validSamples,
        type: strategy.type,
        factors: strategy.factors
    }))
};

fs.writeFileSync(path.join(outputDir, '_MASTER_SUMMARY.json'), JSON.stringify(masterSummary, null, 2));

// Generate README
const readmeContent = `# Winning Strategies Betting Records

This folder contains detailed betting records for all ${winningStrategies.length} profitable strategies discovered in our Asian Handicap analysis.

## Overview

- **Total Strategies Analyzed**: ${strategiesData.length}
- **Winning Strategies**: ${winningStrategies.length} (${(winningStrategies.length / strategiesData.length * 100).toFixed(1)}% success rate)
- **Generated**: ${new Date().toISOString()}

## File Structure

Each winning strategy has two files:
- \`{strategy_name}_summary.json\` - Performance summary and metadata
- \`{strategy_name}_bets.csv\` - Detailed betting records for every bet

## Top 10 Winning Strategies

${winningStrategies.slice(0, 10).map((strategy, index) => 
    `${index + 1}. **${strategy.name}** - ${(strategy.profitability * 100).toFixed(2)}% profit`
).join('\n')}

## Files in This Directory

${winningStrategies.map(strategy => 
    `- \`${strategy.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_summary.json\`
- \`${strategy.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_bets.csv\``
).join('\n')}

## Usage

1. Review \`_MASTER_SUMMARY.json\` for overview of all winning strategies
2. Examine individual \`*_summary.json\` files for strategy performance details
3. Analyze \`*_bets.csv\` files for individual betting decisions and outcomes

## Note

These records are generated based on historical data and should be used for analysis purposes. Past performance does not guarantee future results.
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);

console.log(`\n✅ Extraction complete!`);
console.log(`📁 Output directory: ${outputDir}/`);
console.log(`📊 Generated records for ${winningStrategies.length} winning strategies`);
console.log(`📈 Top strategy: ${winningStrategies[0].name} with ${(winningStrategies[0].profitability * 100).toFixed(2)}% profit`);
console.log(`\nFiles generated:`);
console.log(`- _MASTER_SUMMARY.json (overview of all winning strategies)`);
console.log(`- README.md (documentation)`);
console.log(`- ${winningStrategies.length * 2} strategy files (summary + CSV for each)`); 