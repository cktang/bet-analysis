# Rule Files Guide

This directory contains pluggable rule files that define factors and combinations for Asian Handicap analysis. Each rule file is a Node.js module that exports factor definitions and combination strategies.

## 📁 Rule File Structure

Each rule file should export an object with this structure:

```javascript
module.exports = {
    name: "Rule Category Name",
    description: "Description of what this rule covers", 
    enabled: true,  // Set to false to disable
    factors: [
        {
            name: "factorName",
            expression: "javascript.expression.to.evaluate",
            description: "Human readable description"
        }
    ],
    combinations: [
        {
            name: "Combination_Name",
            factors: ["expression1", "expression2"],
            hypothesis: "Why this combination might work",
            type: "single|domain|cross_analysis|etc"
        }
    ]
};
```

## 📋 Current Rule Files

### ✅ Enabled Rules

- **`xg_factors.js`** - Expected Goals data (homeXG, awayXG, differences)
- **`odds_factors.js`** - Betting odds from all markets (1X2, AH, Over/Under)
- **`market_efficiency.js`** - Market efficiency metrics and implied probabilities
- **`contextual_factors.js`** - Match context (week, attendance, handicap lines)

### ❌ Invalid Rules

- **`_INVALID_performance_factors.js`** - Post-match performance data (DISABLED)
  - Contains match results and should not be used for prediction
  - Prefixed with `_INVALID_` to prevent loading

## 🚀 Usage

### View All Rules
```bash
node rule_loader.js list
```

### View Enabled Factors
```bash
node rule_loader.js factors
```

### View Generated Combinations
```bash
node rule_loader.js combinations
```

### Run Analysis with Rules
```bash
node run_feedback_loop.js
```

## ➕ Adding New Rules

### 1. Create New Rule File
```bash
# Example: Create team form factors
cp contextual_factors.js team_form_factors.js
```

### 2. Edit Factor Definitions
```javascript
module.exports = {
    name: "Team Form Factors",
    description: "Recent team performance and form indicators",
    enabled: true,
    factors: [
        {
            name: "homeFormLast5",
            expression: "team.home.formLast5Games", 
            description: "Home team form over last 5 games"
        }
    ],
    combinations: [
        {
            name: "Form_vs_Market",
            factors: ["team.home.formLast5", "enhanced.marketEfficiency.homeImpliedProb"],
            hypothesis: "Recent form vs market expectations reveals value",
            type: "form_analysis"
        }
    ]
};
```

### 3. Test the Rule
```bash
node rule_loader.js list  # Should show your new rule
```

## 🔧 Modifying Existing Rules

### Enable/Disable Rules
Edit the `enabled` property:
```javascript
module.exports = {
    name: "My Rule",
    enabled: false,  // Disables this entire rule
    // ...
};
```

### Add New Factors
```javascript
factors: [
    // Existing factors...
    {
        name: "newFactor",
        expression: "new.data.path",
        description: "Description of new factor"
    }
]
```

### Add New Combinations
```javascript
combinations: [
    // Existing combinations...
    {
        name: "New_Strategy",
        factors: ["factor1", "factor2"],
        hypothesis: "Why this might work",
        type: "experimental"
    }
]
```

## ⚠️ Important Guidelines

### ✅ Valid Pre-Match Data Only
- **Odds**: `match.homeWinOdds`, `match.asianHandicapOdds.*`
- **Expected Goals**: `fbref.homeXG`, `fbref.awayXG`
- **Market Data**: `enhanced.marketEfficiency.*`
- **Context**: `fbref.week`, `fbref.attendance`

### ❌ Invalid Post-Match Data
- **Performance**: `enhanced.performance.*` (uses actual results)
- **Actual Scores**: `match.homeScore`, `match.awayScore`
- **Goal Efficiency**: Any calculation using actual goals

### 🔍 Data Path Examples
```javascript
// Valid pre-match expressions
"fbref.homeXG - fbref.awayXG"
"match.homeWinOdds / match.awayWinOdds"  
"enhanced.marketEfficiency.cutPercentage"
"parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])"

// Invalid post-match expressions  
"enhanced.performance.homeEfficiency"  // Uses actual goals
"match.homeScore / fbref.homeXG"       // Uses match result
```

## 🎯 Rule Categories

### Single Factors
Simple one-factor combinations testing individual predictive power.

### Domain Knowledge
Two-factor combinations based on betting theory and football knowledge.

### Cross-Analysis
Combinations comparing different data sources (XG vs odds, market vs context).

### Market Efficiency
Combinations testing market pricing accuracy and efficiency.

### Cross-Rule
Automatically generated combinations using factors from different rule files.

## 🔄 Adaptive Learning

The system learns from previous results and can generate new combinations by:
1. Extending successful combinations with additional factors
2. Creating ratio combinations from successful pairs
3. Cross-combining factors from different rule categories

## 🐛 Debugging Rules

### Check Rule Syntax
```bash
node -e "console.log(require('./rules/your_rule.js'))"
```

### Validate Factor Expressions
Test expressions against sample data to ensure they evaluate correctly.

### Monitor Results
Check the generated combinations and results to see if your rules are working as expected.

## 📊 Performance Notes

- **Simple rules** (1-2 factors) load and test faster
- **Complex combinations** (3+ factors) may need larger sample sizes
- **Cross-rule combinations** multiply exponentially - keep rules focused
- **Invalid expressions** will be skipped with error messages

## 🤖 For Other Agents

When adding rules:
1. **Create new `.js` files** in this directory
2. **Follow the structure** shown in existing files  
3. **Test with `rule_loader.js list`** to verify loading
4. **Use only pre-match data** to avoid unrealistic results
5. **Add descriptive names and hypotheses** for clarity

The system will automatically detect and load your new rules!