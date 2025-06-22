const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class BettingRecordExtractor {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('Loading EPL data from all seasons...');
        
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
                console.log(`Loaded ${matches.length} matches from ${season}`);
            }
        });

        console.log(`Total matches loaded: ${this.allMatches.length}`);
        
        // Filter matches with required data
        this.allMatches = this.allMatches.filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
            match.fbref?.homeXG !== undefined &&
            match.fbref?.awayXG !== undefined &&
            match.match?.homeTeam &&
            match.match?.awayTeam &&
            match.match?.homeScore !== undefined &&
            match.match?.awayScore !== undefined
        );
        
        console.log(`Matches with complete data: ${this.allMatches.length}`);
    }

    evaluateValue(match, factorExpression) {
        try {
            const context = {
                match: match.match,
                fbref: match.fbref,
                enhanced: match.enhanced,
                timeSeries: match.timeSeries,
                parseFloat: parseFloat,
                Math: Math
            };

            return Function('match', 'fbref', 'enhanced', 'timeSeries', 'parseFloat', 'Math', 
                `"use strict"; return ${factorExpression}`)(
                context.match, context.fbref, context.enhanced, context.timeSeries,
                context.parseFloat, context.Math
            );
        } catch (error) {
            return null;
        }
    }

    extractBettingRecords(strategy) {
        const matchData = [];
        
        // Evaluate each match
        this.allMatches.forEach(match => {
            const factorValues = [];
            let validMatch = true;

            // Calculate all factor values for this match
            strategy.factors.forEach(factor => {
                const value = this.evaluateValue(match, factor);
                if (value === null || isNaN(value) || !isFinite(value)) {
                    validMatch = false;
                }
                factorValues.push(value);
            });

            if (validMatch) {
                // For single factors, use the value directly
                // For multiple factors, combine them
                const combinedValue = factorValues.length === 1 ? 
                    factorValues[0] : 
                    factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;

                matchData.push({
                    match: match,
                    combinedValue,
                    factorValues,
                    homeProfit: match.enhanced.postMatch.bettingOutcomes.homeProfit,
                    awayProfit: match.enhanced.postMatch.bettingOutcomes.awayProfit,
                    homeOdds: match.match.asianHandicapOdds?.homeOdds || 1.9,
                    awayOdds: match.match.asianHandicapOdds?.awayOdds || 1.9
                });
            }
        });

        if (matchData.length < 10) {
            return { error: 'Insufficient valid samples', records: [] };
        }

        // REPLICATE EXACT BETTING LOGIC FROM WORKING SYSTEM
        const values = matchData.map(d => d.combinedValue);
        const sortedValues = [...values].sort((a, b) => a - b);
        
        // Test different threshold percentages and find the best one
        const thresholds = [10, 15, 20, 25, 30];
        let bestThreshold = 30;
        let bestProfitability = -Infinity;

        thresholds.forEach(threshold => {
            const topCount = Math.floor(matchData.length * (threshold / 100));
            const bottomCount = Math.floor(matchData.length * (threshold / 100));
            
            const sortedMatches = [...matchData].sort((a, b) => b.combinedValue - a.combinedValue);
            const topMatches = sortedMatches.slice(0, topCount);
            const bottomMatches = sortedMatches.slice(-bottomCount);
            
            let totalReturn = 0;
            let totalBets = topMatches.length + bottomMatches.length;
            
            if (totalBets === 0) return;

            topMatches.forEach(match => {
                totalReturn += match.homeProfit;
            });

            bottomMatches.forEach(match => {
                totalReturn += match.awayProfit;
            });

            const totalInvestment = totalBets * 100;
            const profitability = totalReturn / totalInvestment;

            if (profitability > bestProfitability) {
                bestProfitability = profitability;
                bestThreshold = threshold;
            }
        });

        // Generate betting records using best threshold
        const topCount = Math.floor(matchData.length * (bestThreshold / 100));
        const bottomCount = Math.floor(matchData.length * (bestThreshold / 100));
        
        const sortedMatches = [...matchData].sort((a, b) => b.combinedValue - a.combinedValue);
        const topMatches = sortedMatches.slice(0, topCount);
        const bottomMatches = sortedMatches.slice(-bottomCount);

        const bettingRecords = [];

        // Top matches - bet HOME
        topMatches.forEach(matchRecord => {
            const match = matchRecord.match;
            bettingRecords.push({
                date: match.match.date || match.match.matchDate || 'Unknown',
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homeScore: match.match.homeScore,
                awayScore: match.match.awayScore,
                betChoice: 'HOME',
                profit: matchRecord.homeProfit,
                isWin: matchRecord.homeProfit > 0,
                factorValues: matchRecord.factorValues,
                combinedValue: matchRecord.combinedValue,
                homeOdds: matchRecord.homeOdds,
                awayOdds: matchRecord.awayOdds,
                handicap: match.match.asianHandicap || 'Unknown',
                decisionLogic: `Factors: [${matchRecord.factorValues.map(v => (typeof v === 'number' ? v.toFixed(3) : v)).join(', ')}] Combined: ${(typeof matchRecord.combinedValue === 'number' ? matchRecord.combinedValue.toFixed(3) : matchRecord.combinedValue)} → BET HOME (Top ${bestThreshold}%)`
            });
        });

        // Bottom matches - bet AWAY
        bottomMatches.forEach(matchRecord => {
            const match = matchRecord.match;
            bettingRecords.push({
                date: match.match.date || match.match.matchDate || 'Unknown',
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homeScore: match.match.homeScore,
                awayScore: match.match.awayScore,
                betChoice: 'AWAY',
                profit: matchRecord.awayProfit,
                isWin: matchRecord.awayProfit > 0,
                factorValues: matchRecord.factorValues,
                combinedValue: matchRecord.combinedValue,
                homeOdds: matchRecord.homeOdds,
                awayOdds: matchRecord.awayOdds,
                handicap: match.match.asianHandicap || 'Unknown',
                decisionLogic: `Factors: [${matchRecord.factorValues.map(v => (typeof v === 'number' ? v.toFixed(3) : v)).join(', ')}] Combined: ${(typeof matchRecord.combinedValue === 'number' ? matchRecord.combinedValue.toFixed(3) : matchRecord.combinedValue)} → BET AWAY (Bottom ${bestThreshold}%)`
            });
        });

        // Calculate summary statistics
        const totalBets = bettingRecords.length;
        const wins = bettingRecords.filter(r => r.isWin).length;
        const totalProfit = bettingRecords.reduce((sum, r) => sum + r.profit, 0);
        const profitability = totalBets > 0 ? (totalProfit / (totalBets * 100)) * 100 : 0;
        const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

        return {
            records: bettingRecords,
            summary: {
                totalBets,
                wins,
                losses: totalBets - wins,
                winRate,
                totalProfit,
                profitability,
                averageProfitPerBet: totalBets > 0 ? totalProfit / totalBets : 0,
                bestThreshold,
                validSamples: matchData.length
            }
        };
    }

    extractWinningStrategies() {
        // Load winning strategies from all_strategies_sorted.json
        const strategiesData = JSON.parse(fs.readFileSync('all_strategies_sorted.json', 'utf8'));
        const winningStrategies = strategiesData.filter(strategy => strategy.profitability > 0);

        console.log(`Found ${winningStrategies.length} winning strategies`);

        // Create output directory
        const outputDir = 'winning_strategies_records_REAL';
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });

        const masterSummary = {
            generatedAt: new Date().toISOString(),
            totalStrategies: winningStrategies.length,
            totalMatches: this.allMatches.length,
            strategies: []
        };

        // Process each winning strategy
        for (const strategy of winningStrategies) {
            console.log(`\nProcessing: ${strategy.name} (${strategy.profitability.toFixed(4)}% original)`);

            const result = this.extractBettingRecords(strategy);
            
            if (result.error) {
                console.log(`  Error: ${result.error}`);
                continue;
            }

            const { records, summary } = result;

            // Save CSV file
            const csvFilename = `${strategy.name.replace(/[^a-zA-Z0-9]/g, '_')}_bets.csv`;
            const csvPath = path.join(outputDir, csvFilename);
            
            let csvContent = '"Date","Home Team","Away Team","Home Score","Away Score","Bet Choice","Profit","Is Win","Factor Values","Combined Value","Decision Logic","Home Odds","Away Odds","Handicap"\n';
            
            for (const record of records) {
                                 csvContent += `"${record.date}","${record.homeTeam}","${record.awayTeam}","${record.homeScore}","${record.awayScore}","${record.betChoice}","${record.profit}","${record.isWin}","[${record.factorValues.map(v => (typeof v === 'number' ? v.toFixed(3) : v)).join(', ')}]","${(typeof record.combinedValue === 'number' ? record.combinedValue.toFixed(3) : record.combinedValue)}","${record.decisionLogic}","${record.homeOdds}","${record.awayOdds}","${record.handicap}"\n`;
            }
            
            fs.writeFileSync(csvPath, csvContent);

            // Save summary JSON
            const summaryFilename = `${strategy.name.replace(/[^a-zA-Z0-9]/g, '_')}_summary.json`;
            const summaryPath = path.join(outputDir, summaryFilename);
            
            const strategySummary = {
                name: strategy.name,
                originalProfitability: strategy.profitability,
                calculatedProfitability: summary.profitability,
                factors: strategy.factors,
                ...summary,
                sampleBets: records.slice(0, 10)
            };
            
            fs.writeFileSync(summaryPath, JSON.stringify(strategySummary, null, 2));

            masterSummary.strategies.push({
                name: strategy.name,
                originalProfitability: strategy.profitability,
                calculatedProfitability: summary.profitability,
                totalBets: summary.totalBets,
                winRate: summary.winRate,
                totalProfit: summary.totalProfit
            });

            console.log(`  Generated ${summary.totalBets} betting records`);
            console.log(`  Calculated profitability: ${summary.profitability.toFixed(2)}%`);
            console.log(`  Win rate: ${summary.winRate.toFixed(2)}%`);
        }

        // Save master summary
        fs.writeFileSync(path.join(outputDir, '_MASTER_SUMMARY.json'), JSON.stringify(masterSummary, null, 2));

        // Create README
        const readmeContent = `# REAL Winning Strategies Betting Records

Generated: ${new Date().toISOString()}

## Data Source
- Uses the ACTUAL working strategy testing system
- Profit values from pre-calculated betting outcomes
- Exact same betting logic that produced the original profitable results

## Summary
- **Total Strategies**: ${winningStrategies.length}
- **Total Matches**: ${this.allMatches.length}
- **Data Quality**: Real match data with actual profit/loss calculations

## Strategy Performance
${masterSummary.strategies.map(s => 
    `- **${s.name}**: ${s.calculatedProfitability.toFixed(2)}% profit (${s.totalBets} bets, ${s.winRate.toFixed(1)}% win rate)`
).join('\n')}

## Betting Logic
Each strategy uses selective betting:
1. Calculate factor values for all matches
2. Sort matches by combined factor value
3. Bet HOME on top X% of matches
4. Bet AWAY on bottom X% of matches  
5. Threshold (X%) chosen for maximum profitability

## Files
${winningStrategies.map(s => {
    const safeName = s.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `- \`${safeName}_summary.json\` - Strategy analysis\n- \`${safeName}_bets.csv\` - Individual betting records`;
}).join('\n')}
`;

        fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);

        console.log(`\n✅ Successfully extracted REAL betting records`);
        console.log(`📁 Output: ${outputDir}`);
        console.log(`📊 Files: ${winningStrategies.length * 2 + 2}`);
    }
}

if (require.main === module) {
    const extractor = new BettingRecordExtractor();
    extractor.extractWinningStrategies();
}

module.exports = BettingRecordExtractor; 