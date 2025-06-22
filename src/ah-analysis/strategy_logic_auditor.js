const fs = require('fs');
const path = require('path');

/**
 * Strategy Logic Auditor - Reviews all strategy factors for logical errors
 */
class StrategyLogicAuditor {
    constructor() {
        this.rulesDir = path.join(__dirname, 'src/ah-analysis/rules');
        this.logicalErrors = [];
        this.suspiciousFactors = [];
        this.reviewedFactors = [];
    }

    /**
     * Load and review all strategy rule files
     */
    auditAllStrategies() {
        console.log('🔍 STRATEGY LOGIC AUDIT SYSTEM\n');
        console.log('Systematically reviewing all strategy factors for logical errors...\n');

        const ruleFiles = fs.readdirSync(this.rulesDir)
            .filter(file => file.endsWith('.js') && !file.startsWith('_'))
            .filter(file => file !== 'README.md');

        ruleFiles.forEach(file => {
            console.log(`📋 Auditing: ${file}`);
            this.auditRuleFile(file);
        });

        this.generateAuditReport();
    }

    /**
     * Audit a specific rule file
     */
    auditRuleFile(fileName) {
        const filePath = path.join(this.rulesDir, fileName);
        
        try {
            const ruleModule = require(filePath);
            
            if (ruleModule.factors) {
                ruleModule.factors.forEach(factor => {
                    this.auditFactor(factor, fileName);
                });
            }

            if (ruleModule.combinations) {
                ruleModule.combinations.forEach(combination => {
                    this.auditCombination(combination, fileName);
                });
            }
        } catch (error) {
            console.log(`  ❌ Error loading ${fileName}: ${error.message}`);
        }
    }

    /**
     * Audit individual factor for logical errors
     */
    auditFactor(factor, fileName) {
        const review = {
            fileName,
            factorName: factor.name,
            expression: factor.expression,
            description: factor.description,
            issues: [],
            severity: 'OK'
        };

        // Check for known problematic patterns
        this.checkInvertedLogic(factor, review);
        this.checkMissingNullHandling(factor, review);
        this.checkSuspiciousComparisons(factor, review);
        this.checkMathLogic(factor, review);
        this.checkPositionLogic(factor, review);

        if (review.issues.length > 0) {
            if (review.issues.some(issue => issue.includes('CRITICAL'))) {
                review.severity = 'CRITICAL';
                this.logicalErrors.push(review);
            } else {
                review.severity = 'WARNING';
                this.suspiciousFactors.push(review);
            }
        }

        this.reviewedFactors.push(review);
    }

    /**
     * Check for inverted logic (like the relegation pressure bug)
     */
    checkInvertedLogic(factor, review) {
        const expr = factor.expression.toLowerCase();
        const desc = factor.description.toLowerCase();
        const name = factor.name.toLowerCase();

        // Relegation pressure check
        if (name.includes('relegation') && expr.includes('18 -')) {
            review.issues.push('CRITICAL: Inverted relegation logic - formula gives high values to TOP teams');
        }

        // European pressure check  
        if (name.includes('european') && expr.includes('7 -')) {
            review.issues.push('WARNING: European pressure formula may be inverted');
        }

        // Form vs description mismatches
        if (desc.includes('bottom') && expr.includes('<=') && !expr.includes('>=')) {
            review.issues.push('WARNING: Bottom teams described but using <= comparison');
        }

        if (desc.includes('top') && expr.includes('>=') && !expr.includes('<=')) {
            review.issues.push('WARNING: Top teams described but using >= comparison');
        }
    }

    /**
     * Check for missing null/undefined handling
     */
    checkMissingNullHandling(factor, review) {
        const expr = factor.expression;
        
        // Check if expression uses properties that could be undefined
        const riskyProperties = [
            'leaguePosition', 'homeScore', 'awayScore', 'goalDifference',
            'streaks', 'cumulative', 'fbref', 'enhanced'
        ];

        riskyProperties.forEach(prop => {
            if (expr.includes(prop) && !expr.includes(`|| `)) {
                review.issues.push(`WARNING: Missing null handling for ${prop}`);
            }
        });
    }

    /**
     * Check for suspicious comparison logic
     */
    checkSuspiciousComparisons(factor, review) {
        const expr = factor.expression;
        const name = factor.name.toLowerCase();

        // Check for position comparisons that might be backwards
        if (name.includes('top') && expr.includes('>= ')) {
            review.issues.push('SUSPICIOUS: Top teams using >= (higher numbers)');
        }

        if (name.includes('bottom') && expr.includes('<= ')) {
            review.issues.push('SUSPICIOUS: Bottom teams using <= (lower numbers)');
        }

        // Check for goal difference logic
        if (name.includes('goal') && expr.includes('-') && !expr.includes('Math.abs')) {
            review.issues.push('WARNING: Goal difference calculation may not handle negative values');
        }
    }

    /**
     * Check mathematical logic
     */
    checkMathLogic(factor, review) {
        const expr = factor.expression;

        // Division by zero risks
        if (expr.includes('/') && !expr.includes('!== 0')) {
            review.issues.push('WARNING: Potential division by zero');
        }

        // Probability calculations
        if (expr.includes('Prob') && expr.includes('*')) {
            if (!expr.includes('/ 100') && expr.includes('* 20')) {
                review.issues.push('WARNING: Probability scaling may be incorrect');
            }
        }
    }

    /**
     * Check position-specific logic
     */
    checkPositionLogic(factor, review) {
        const expr = factor.expression;
        const name = factor.name.toLowerCase();

        // Premier League has 20 teams (positions 1-20)
        if (expr.includes('|| 20') && name.includes('position')) {
            // This is actually correct - 20 is worst possible position
        }

        // Check for position thresholds
        if (name.includes('top') && expr.includes('<= 6')) {
            // This is correct - top 6 means positions 1,2,3,4,5,6
        }

        if (name.includes('bottom') && expr.includes('>= 18')) {
            // This is correct - bottom 3 means positions 18,19,20
        }

        // But check for the relegation pressure bug pattern
        if (name.includes('relegation') && expr.includes('Math.max(0, 18 -')) {
            review.issues.push('CRITICAL: Relegation pressure formula is inverted - gives high values to top teams');
        }
    }

    /**
     * Audit combination strategies
     */
    auditCombination(combination, fileName) {
        const review = {
            fileName,
            combinationName: combination.name,
            factors: combination.factors,
            hypothesis: combination.hypothesis,
            issues: [],
            severity: 'OK'
        };

        // Check if combination name matches hypothesis
        const nameWords = combination.name.toLowerCase().split('_');
        const hypothesisWords = combination.hypothesis.toLowerCase();

        if (nameWords.includes('relegation') && !hypothesisWords.includes('relegation')) {
            review.issues.push('WARNING: Combination name mentions relegation but hypothesis does not');
        }

        if (combination.factors) {
            combination.factors.forEach(factorExpr => {
                if (factorExpr.includes('Math.max(0, 18 -') && combination.name.includes('Relegation')) {
                    review.issues.push('CRITICAL: Relegation combination uses inverted formula');
                }
            });
        }

        if (review.issues.length > 0) {
            this.logicalErrors.push(review);
        }
    }

    /**
     * Generate comprehensive audit report
     */
    generateAuditReport() {
        console.log('\n🚨 CRITICAL ERRORS FOUND:\n');
        
        if (this.logicalErrors.length === 0) {
            console.log('✅ No critical errors detected');
        } else {
            this.logicalErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.fileName} - ${error.factorName || error.combinationName}`);
                error.issues.forEach(issue => {
                    console.log(`   ❌ ${issue}`);
                });
                if (error.expression) {
                    console.log(`   🔍 Expression: ${error.expression}`);
                }
                console.log();
            });
        }

        console.log('\n⚠️  WARNINGS AND SUSPICIOUS PATTERNS:\n');
        
        if (this.suspiciousFactors.length === 0) {
            console.log('✅ No suspicious patterns detected');
        } else {
            this.suspiciousFactors.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.fileName} - ${warning.factorName}`);
                warning.issues.forEach(issue => {
                    console.log(`   ⚠️  ${issue}`);
                });
                console.log();
            });
        }

        // Generate summary statistics
        const totalFactors = this.reviewedFactors.length;
        const criticalErrors = this.logicalErrors.length;
        const warnings = this.suspiciousFactors.length;
        const cleanFactors = totalFactors - criticalErrors - warnings;

        console.log('\n📊 AUDIT SUMMARY:\n');
        console.log(`Total factors reviewed: ${totalFactors}`);
        console.log(`Critical errors: ${criticalErrors}`);
        console.log(`Warnings: ${warnings}`);
        console.log(`Clean factors: ${cleanFactors}`);
        console.log(`Error rate: ${((criticalErrors/totalFactors)*100).toFixed(1)}%`);

        // Save detailed audit report
        const auditReport = {
            auditDate: new Date().toISOString(),
            summary: {
                totalFactors,
                criticalErrors,
                warnings,
                cleanFactors,
                errorRate: (criticalErrors/totalFactors)*100
            },
            criticalErrors: this.logicalErrors,
            warnings: this.suspiciousFactors,
            allFactors: this.reviewedFactors
        };

        fs.writeFileSync('strategy_audit_report.json', JSON.stringify(auditReport, null, 2));
        console.log('\n💾 Detailed audit report saved to: strategy_audit_report.json');

        this.generateFixRecommendations();
    }

    /**
     * Generate specific fix recommendations
     */
    generateFixRecommendations() {
        console.log('\n🔧 FIX RECOMMENDATIONS:\n');

        const fixes = [];

        this.logicalErrors.forEach(error => {
            if (error.factorName === 'relegationPressure') {
                fixes.push({
                    factor: 'relegationPressure',
                    currentFormula: 'Math.max(0, 18 - position)',
                    fixedFormula: 'Math.max(0, position - 17)',
                    explanation: 'Current formula gives high values to top teams. Fixed formula gives high values to teams in positions 18, 19, 20'
                });
            }

            if (error.factorName === 'europeanPressure') {
                fixes.push({
                    factor: 'europeanPressure', 
                    issue: 'Verify if formula is intended behavior',
                    explanation: 'Current formula gives high values to top teams competing for European spots'
                });
            }
        });

        fixes.forEach((fix, index) => {
            console.log(`${index + 1}. ${fix.factor}:`);
            if (fix.currentFormula && fix.fixedFormula) {
                console.log(`   Current: ${fix.currentFormula}`);
                console.log(`   Fixed: ${fix.fixedFormula}`);
            }
            console.log(`   Explanation: ${fix.explanation}\n`);
        });

        return fixes;
    }
}

// Run the audit
const auditor = new StrategyLogicAuditor();
auditor.auditAllStrategies();