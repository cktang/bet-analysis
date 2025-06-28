# 📊 Betting Patterns Visualization

## Bar Chart Visualization (New!)

Perfect solution for visualizing the deduplicated betting patterns data.

### 🚀 Quick Start
```bash
cd src/pattern-discovery
node serve_visualization.js
```

Then open: **http://localhost:3000**

### 📊 Features

**Interactive Filtering:**
- **Performance Filter**: Show all patterns, profitable only, excellent (>50%), good (>20%), or modest (>10%)
- **Min Bets Filter**: Filter by minimum number of bets (default: 5)
- **Sort Options**: Sort by ROI, Total Profit, Number of Bets, or Win Rate

**Visual Elements:**
- 🟢 **Green bars**: Profitable patterns (ROI > 0%)
- 🔵 **Blue bars**: Break-even patterns (-5% to 0% ROI)  
- 🔴 **Red bars**: Loss patterns (ROI < -5%)
- **Zero line**: Dashed line showing break-even point
- **Tooltips**: Hover for detailed pattern information
- **Click**: Get detailed breakdown in popup

**Real-time Stats:**
- Shows number of patterns displayed
- Count of profitable patterns
- Average ROI of displayed patterns
- Total profit from displayed patterns

### 📈 Data Overview
- **777 unique patterns** (after removing 99.89% duplicates)
- **264 profitable patterns**
- **513 loss patterns** 
- **Data source**: `results/clean_discovery.json`

### 🎯 Use Cases
1. **Find top performers**: Set filter to "Excellent" and sort by ROI
2. **Volume analysis**: Sort by "Number of Bets" to see patterns with most data
3. **Profit analysis**: Sort by "Total Profit" to see biggest money makers
4. **Reliability check**: Increase "Min Bets" to focus on patterns with more data

### 🔧 Alternative Visualizations
- **Treemap**: Still available at `/treemap_visualization.html` (works but limited due to data structure)
- **Test page**: Available at `/test_treemap.html` for debugging

### 💡 Tips
- Default view shows profitable patterns with ≥5 bets sorted by ROI
- Click on bars for detailed pattern breakdown
- Pattern names use format: `factor1 → factor2 → factor3`
- Higher bars = better ROI performance 