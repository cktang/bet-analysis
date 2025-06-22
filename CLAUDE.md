# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive football betting analysis system that scrapes data from multiple sources (HKJC, OddsPortal), performs statistical analysis, and provides betting insights. The system focuses on Expected Goals (xG) analysis, Asian Handicap betting, and systematic strategy development.

## Commands

### Running Tests/Scrapers
```bash
# Run scrapers (from root directory)
npx playwright test scrap-hkjc-result.spec.ts
npx playwright test scrap-oddsportal-result.spec.ts

# Process scraped data (from src/parsers/ directory)
cd src/parsers/
node scrap-oddsportal.result.parser
node scrap-hkjc.result.parser
node data-joiner
```

### Web Dashboard (optional)
```bash
cd webapp/
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Code formatting check
npm run test:e2e   # End-to-end tests
```

### Data Analysis Scripts
```bash
cd src/analysis/
# Core analysis tools
node analyze_xg.js                    # xG vs actual results analysis
node analyze_xg_vs_ah_line.js        # xG vs Asian Handicap lines
node analyze_xg_vs_ah_pl.js          # Profit/loss analysis
node backtester.js                   # Backtest betting strategies
node rule_generator.js               # Generate new betting rules

# Performance analysis
node analyze_monthly_performance.js   # Monthly betting patterns
node analyze_weekly_performance.js    # Weekly betting patterns
node analyze_overreaction.js         # Market overreaction analysis
```

### Data Processing Scripts
```bash
cd src/scripts/
# Data merging utilities
node merge_data.js                   # Merge data from multiple sources
```

## Architecture

### Core Components

**Data Pipeline:**
- `tests/` - Playwright scrapers for HKJC and OddsPortal
- `src/parsers/scrap-*.result.parser.js` - Process raw scraped data
- `src/parsers/data-joiner.js` - Merge data from multiple sources
- `src/scripts/` - Data merging and utility scripts
- `data/raw/` - Raw scraped data storage by league
- `data/processed/` - Processed CSV data ready for analysis

**Analysis Engine:**
- `src/analysis/analyze_*.js` - Statistical analysis scripts
- `src/analysis/backtester.js` - Strategy backtesting framework
- `src/analysis/rule_generator.js` - Automated rule generation
- Focus on Expected Goals (xG) analysis and Asian Handicap betting

**Data Storage:**
- Match data organized by league: "Eng Premier", "French Division 1", "German Division 1", "Italian Division 1", "Spanish Division 1"
- Expected Goals data from FBRef integration in `data/processed/fbref/`
- Real-time odds tracking in `data/tracker/odds-movement/`
- Bet placement records in `data/processed/betPlaced/`

**Optional Web Dashboard:**
- `webapp/` - SvelteKit dashboard with data visualization
- Uses Highcharts, LayerChart, and D3 for charts
- Tailwind CSS for styling

### Key Data Flow

1. **Scraping:** Playwright tests collect match results and odds
2. **Processing:** Parser scripts clean and structure data
3. **Analysis:** Statistical analysis identifies betting opportunities
4. **Strategy:** Rules are generated and backtested
5. **Tracking:** Live odds monitoring and bet placement

### Important Files

- `workflow.txt` - Basic workflow commands
- `src/parsers/teams.js` - League and team configuration
- `src/parsers/util.js` - Common utilities for match processing
- `src/parsers/hkjc-util.js` - HKJC-specific utilities
- `src/scripts/` - Data processing and merging utilities
- `playwright.config.ts` - Browser automation configuration with geolocation and auth cookies

### Analysis Capabilities

**Expected Goals Analysis:**
- xG prediction accuracy vs actual results
- Market efficiency testing using xG models
- xG trends and team performance metrics

**Betting Strategy Analysis:**
- Asian Handicap line analysis and value identification
- Profit/loss simulations with ROI calculations
- Market overreaction and behavioral pattern detection
- Temporal analysis (monthly/weekly performance patterns)

**Data Sources:**
- HKJC (Hong Kong Jockey Club) for Asian markets
- OddsPortal for European odds comparison
- FBRef for Expected Goals data
- Real-time odds movement tracking

## Development Notes

- Main package uses Node.js with Playwright for browser automation
- Svelte app is separate frontend with TypeScript support
- Data processing uses Lodash for functional programming patterns
- All dates handled with Moment.js
- CSV processing with json2csv library
- Real-time data monitoring with Chokidar file watcher

## Coding Rules
- use Typescript/NodeJS whenever possible
- use RXJS whenever possible so we can easily refactor things later
- write as clean as possible with comments on every method

## Project Structure Guidelines
- Follow previous rules, put ah_analysis all things inside src/ah-analysis