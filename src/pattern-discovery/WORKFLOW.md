# 🎯 Betting Pattern Discovery - Essential Workflow

## Core Files (7 total)

### 1. **`factor_definitions.js`** - Define Rules
- Contains all betting condition definitions
- Edit this to add new factors or modify existing ones

### 2. **`simple_discovery.js`** - Generate Patterns  
- Runs pattern discovery analysis
- Combines factors and tests betting results
```bash
node simple_discovery.js
```

### 3. **`create_clean_data.js`** - Clean Data
- Removes duplicate patterns (99.9% reduction!)
- Creates `results/clean_discovery.json`
```bash
node create_clean_data.js
```

### 4. **`bar_chart_visualization.html`** - View Results
- Interactive bar chart + detailed table
- Click rows for comprehensive pattern analysis

### 5. **`quick_start.js`** - Start Server
- Serves the visualization on http://localhost:3000
```bash
node quick_start.js
```

### 6. **`results/`** - Data Directory
- `complete_discovery.json` - Raw patterns
- `clean_discovery.json` - Deduplicated data

### 7. **Documentation**
- `README.md` - Main guide
- `README_VISUALIZATION.md` - Visualization details

## 🚀 Quick Start

```bash
# 1. Generate patterns (if needed)
node simple_discovery.js

# 2. Clean data (if needed) 
node create_clean_data.js

# 3. View results
node quick_start.js
# Then open: http://localhost:3000
```

## ✅ Complete System

This is now a **minimal, focused system** for:
- ✅ Pattern discovery
- ✅ Data deduplication  
- ✅ Interactive visualization
- ✅ Detailed analysis

No redundant files, no complex dependencies! 