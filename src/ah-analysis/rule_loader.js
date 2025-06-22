const fs = require('fs');
const path = require('path');

class RuleLoader {
    constructor() {
        this.rulesPath = path.join(__dirname, 'rules');
        this.loadedRules = [];
    }

    loadAllRules() {
        console.log('📁 Loading all rule files...');
        
        if (!fs.existsSync(this.rulesPath)) {
            console.log('❌ Rules directory not found');
            return [];
        }

        const ruleFiles = fs.readdirSync(this.rulesPath)
            .filter(file => file.endsWith('.js'));

        this.loadedRules = [];

        ruleFiles.forEach(file => {
            try {
                const rulePath = path.join(this.rulesPath, file);
                delete require.cache[require.resolve(rulePath)]; // Clear cache for reloading
                const rule = require(rulePath);
                
                if (file.startsWith('_INVALID_')) {
                    console.log(`⚠️  Skipping INVALID rule file: ${file}`);
                    return;
                }
                
                if (rule.enabled === false) {
                    console.log(`⏸️  Skipping disabled rule: ${rule.name} (${file})`);
                    return;
                }

                this.loadedRules.push({
                    ...rule,
                    fileName: file,
                    filePath: rulePath
                });
                
                console.log(`✅ Loaded rule: ${rule.name} (${file})`);
                
            } catch (error) {
                console.log(`❌ Failed to load ${file}: ${error.message}`);
            }
        });

        console.log(`📊 Total rules loaded: ${this.loadedRules.length}`);
        return this.loadedRules;
    }

    getAllFactors() {
        const allFactors = [];
        
        this.loadedRules.forEach(rule => {
            rule.factors.forEach(factor => {
                allFactors.push({
                    ...factor,
                    ruleName: rule.name,
                    ruleFile: rule.fileName
                });
            });
        });

        return allFactors;
    }

    getAllCombinations() {
        const allCombinations = [];
        
        this.loadedRules.forEach(rule => {
            if (rule.combinations) {
                rule.combinations.forEach(combination => {
                    allCombinations.push({
                        ...combination,
                        ruleName: rule.name,
                        ruleFile: rule.fileName
                    });
                });
            }
        });

        return allCombinations;
    }

    getEnabledFactors() {
        return this.getAllFactors().filter(factor => !factor.invalid);
    }

    getEnabledCombinations() {
        return this.getAllCombinations().filter(combination => {
            const rule = this.loadedRules.find(r => r.name === combination.ruleName);
            return rule && rule.enabled !== false;
        });
    }

    listAllRules() {
        console.log('\n📋 RULE INVENTORY:\n');
        
        const allFiles = fs.readdirSync(this.rulesPath)
            .filter(file => file.endsWith('.js'));

        allFiles.forEach(file => {
            try {
                const rulePath = path.join(this.rulesPath, file);
                const rule = require(rulePath);
                
                const status = file.startsWith('_INVALID_') ? '❌ INVALID' :
                             rule.enabled === false ? '⏸️  DISABLED' : '✅ ENABLED';
                
                console.log(`${status} ${file}`);
                console.log(`   Name: ${rule.name}`);
                console.log(`   Description: ${rule.description}`);
                console.log(`   Factors: ${rule.factors ? rule.factors.length : 0}`);
                console.log(`   Combinations: ${rule.combinations ? rule.combinations.length : 0}`);
                
                if (rule.warning) {
                    console.log(`   ⚠️  Warning: ${rule.warning}`);
                }
                console.log('');
                
            } catch (error) {
                console.log(`❌ ERROR ${file}: ${error.message}\n`);
            }
        });
    }

    generateCombinationsFromRules() {
        const combinations = [];
        
        // Add predefined combinations from rules
        combinations.push(...this.getEnabledCombinations());
        
        // Generate single-factor combinations
        this.getEnabledFactors().forEach(factor => {
            combinations.push({
                name: `Single_${factor.name}`,
                factors: [factor.expression],
                type: 'single',
                hypothesis: `${factor.description} predicts AH outcomes`,
                ruleName: factor.ruleName,
                ruleFile: factor.ruleFile
            });
        });

        // Generate cross-rule combinations (factors from different rules)
        const factorGroups = {};
        this.loadedRules.forEach(rule => {
            factorGroups[rule.name] = rule.factors.filter(f => !f.invalid);
        });

        const ruleNames = Object.keys(factorGroups);
        for (let i = 0; i < ruleNames.length; i++) {
            for (let j = i + 1; j < ruleNames.length; j++) {
                const rule1 = ruleNames[i];
                const rule2 = ruleNames[j];
                
                // Take first factor from each rule for cross-rule combination
                if (factorGroups[rule1].length > 0 && factorGroups[rule2].length > 0) {
                    const factor1 = factorGroups[rule1][0];
                    const factor2 = factorGroups[rule2][0];
                    
                    combinations.push({
                        name: `CrossRule_${factor1.name}_x_${factor2.name}`,
                        factors: [factor1.expression, factor2.expression],
                        type: 'cross_rule',
                        hypothesis: `${factor1.description} combined with ${factor2.description}`,
                        ruleName: `${rule1} x ${rule2}`,
                        ruleFile: 'generated'
                    });
                }
            }
        }

        return combinations;
    }
}

// Command line interface
if (require.main === module) {
    const loader = new RuleLoader();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'list':
            loader.loadAllRules();
            loader.listAllRules();
            break;
            
        case 'factors':
            loader.loadAllRules();
            const factors = loader.getEnabledFactors();
            console.log('\n📊 ENABLED FACTORS:\n');
            factors.forEach((factor, index) => {
                console.log(`${index + 1}. ${factor.name} (${factor.ruleFile})`);
                console.log(`   Expression: ${factor.expression}`);
                console.log(`   Description: ${factor.description}`);
                console.log('');
            });
            break;
            
        case 'combinations':
            loader.loadAllRules();
            const combinations = loader.generateCombinationsFromRules();
            console.log(`\n🔗 GENERATED ${combinations.length} COMBINATIONS:\n`);
            combinations.slice(0, 10).forEach((combo, index) => {
                console.log(`${index + 1}. ${combo.name} (${combo.type})`);
                console.log(`   Factors: ${combo.factors.join(', ')}`);
                console.log(`   Hypothesis: ${combo.hypothesis}`);
                console.log('');
            });
            if (combinations.length > 10) {
                console.log(`... and ${combinations.length - 10} more combinations`);
            }
            break;
            
        default:
            console.log('📖 Rule Loader Usage:');
            console.log('  node rule_loader.js list        - List all rule files');
            console.log('  node rule_loader.js factors     - Show enabled factors');
            console.log('  node rule_loader.js combinations - Show generated combinations');
    }
}

module.exports = RuleLoader;