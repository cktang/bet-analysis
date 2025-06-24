# Asian Handicap Strategy Analysis Report

This is a professional HTML report that displays the results of the Asian Handicap betting strategy analysis.

## Features

- **Dark Theme**: Professional dark-themed design for comfortable viewing
- **Strategy Summary**: Left panel shows all 309 strategies with key metrics
- **Detailed View**: Right panel shows detailed betting records when a strategy is clicked
- **Interactive**: Click on any strategy to view its betting history
- **Responsive**: Works on desktop and mobile devices

## How to Use

1. Open `index.html` in your web browser
2. Browse strategies in the left panel - they're sorted by performance
3. Click on any strategy to view detailed betting records
4. The right panel will show:
   - Strategy metrics (ROI, correlation, win rate, etc.)
   - Hypothesis explanation
   - Detailed betting records table

## Strategy Information Displayed

### Left Panel (Strategy List)
- Strategy name
- ROI percentage (color-coded: green for profitable, red for losing)
- Correlation value
- Win rate
- Total number of bets
- Strategy hypothesis

### Right Panel (Strategy Details)
- Complete strategy metrics
- Detailed betting records showing:
  - Match date
  - Teams involved
  - Actual score
  - Handicap line
  - Bet side
  - Odds
  - Outcome (Win/Loss/Push)
  - Profit/Loss

## File Structure

```
report/
├── index.html          # Main report page
└── README.md          # This file
```

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for Tailwind CSS CDN)
- Access to the `../results/` directory containing JSON files

## Data Sources

The report loads data from:
- `../results/summary.json` - Strategy summary and metadata
- `../results/*_betting_records.json` - Individual strategy betting records

## Performance Notes

- For performance, only the first 50 betting records are shown for each strategy
- All strategies are loaded at once for quick browsing
- Individual strategy details are loaded on-demand when clicked 