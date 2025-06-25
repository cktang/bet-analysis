# Asian Handicap Analysis - Flow Guide

## 🚀 **ONE-COMMAND SOLUTION**

```bash
./src/ah-analysis/run_complete_analysis.sh
```

**This single command:**
- ✅ Checks all dependencies
- 📦 Installs npm packages if needed  
- 🧪 Runs complete analysis (tests 434+ strategies)
- 🌐 Starts web server on http://localhost:8000
- 🌟 Auto-opens browser to view results
- 🔄 Keeps server running (Ctrl+C to stop)

---

## ⚡ **ALTERNATIVE QUICK RUN**

```bash
./src/ah-analysis/quick_run.sh
```

Simpler version: just runs analysis + starts server.

---

## 🔧 **MANUAL APPROACH** (If scripts fail)

### Step 1: Run Analysis
```bash
cd /path/to/bet-analysis
node src/ah-analysis/scripts/run_feedback_loop.js
```

### Step 2: Start Web Server
```bash
node src/ah-analysis/scripts/serve_report.js &
```

### Step 3: View Results
```bash
open http://localhost:8000
```

---

## 📊 **UNDERSTANDING THE RESULTS**

### Web Interface
- **Main Dashboard**: http://localhost:8000
- **Strategy List**: Sorted by ROI, click for details
- **Betting Records**: Individual bet outcomes
- **Performance Metrics**: Win rate, correlation, profitability

### Current Best Strategies
1. **Heavy_Away_Favorites_All_Season**: 19.33% ROI
2. **Single_bottomSixFavorite**: 17.36% ROI  
3. **Single_awayLateSeasonTopSix**: 16.56% ROI
4. **Late_Season_Close_AH_Pressure**: 14.88% ROI
5. **Single_bigSixClashesOnly**: 13.80% ROI

### Key Files
- **Summary**: `src/ah-analysis/results/summary.json`
- **Individual Strategies**: `src/ah-analysis/results/*_betting_records.json`
- **Rules**: `src/ah-analysis/rules/*.js`

---

## 🛠️ **TROUBLESHOOTING**

### Server Won't Start
```bash
# Kill existing server
lsof -ti :8000 | xargs kill -9

# Check if port is free
lsof -i :8000
```

### Analysis Fails
```bash
# Check Node.js version (need v14+)
node --version

# Install dependencies
npm install
```

### Browser Shows "Loading..."
- Make sure server is running on port 8000
- Check browser console for CORS errors
- Try: http://localhost:8000/results/summary.json directly

### No Results Generated
```bash
# Check data files exist
ls -la data/enhanced/

# Verify script path
which node
```

---

## 📁 **FILE STRUCTURE**

```
src/ah-analysis/
├── run_complete_analysis.sh     # 🚀 Main flow script
├── quick_run.sh                 # ⚡ Quick runner
├── scripts/
│   ├── run_feedback_loop.js     # Analysis engine
│   ├── serve_report.js          # Web server
│   └── ah_combination_tester.js # Strategy tester
├── rules/
│   ├── ah_value_hunting.js      # 🎯 YOUR value strategies
│   ├── hkjc_specific_edges.js   # 🎰 HKJC-focused rules
│   └── *.js                     # Other rule files
├── results/
│   ├── summary.json             # 📊 Main results
│   └── *_betting_records.json   # Individual strategy data
└── report/
    └── index.html               # 🌐 Web interface
```

---

## 🎯 **NEXT STEPS AFTER RUNNING**

1. **Review Web Interface**
   - Sort strategies by ROI
   - Click on profitable strategies for details
   - Analyze betting record patterns

2. **Implement Best Strategies**
   - Focus on strategies with 50+ bets
   - Consider risk management (Kelly criterion)
   - Test with small stakes first

3. **Customize Rules**
   - Edit `rules/ah_value_hunting.js` 
   - Add new factor combinations
   - Re-run analysis to test

4. **Monitor Performance**
   - Track real-world results
   - Compare to backtested expectations
   - Adjust strategies as needed

---

## 💡 **TIPS**

- **Always use the web interface** - much easier than JSON files
- **Focus on strategies with 50+ bets** - more reliable samples
- **Check correlation AND profitability** - both matter
- **Consider bet frequency** - high-frequency strategies easier to implement
- **Test new rules incrementally** - add one factor at a time

---

## 📞 **QUICK REFERENCE**

| Task | Command |
|------|---------|
| **Full Analysis** | `./src/ah-analysis/run_complete_analysis.sh` |
| **Quick Run** | `./src/ah-analysis/quick_run.sh` |
| **View Results** | Open http://localhost:8000 |
| **Stop Server** | `Ctrl+C` or `lsof -ti :8000 \| xargs kill -9` |
| **Check Status** | `curl -s http://localhost:8000/results/summary.json \| jq .metadata` |

---

**🎉 You now have a complete flow for discovering profitable Asian Handicap strategies!** 