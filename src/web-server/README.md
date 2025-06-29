# Unified Web Server

A consolidated web server that hosts all HTML reports, dashboards, and APIs for the bet analysis project.

## 🚀 Quick Start

```bash
# From anywhere in the project
node src/web-server/start-server.js

# Or directly run the server
node src/web-server/unified-server.js
```

## 🌐 Available Services

### Main Hub
- **URL**: `http://localhost:3000`
- **Description**: Central navigation page for all project resources

### Pattern Discovery Dashboard
- **URL**: `http://localhost:3000/pattern-discovery`
- **Interactive Drill**: `http://localhost:3000/pattern-discovery/drill`
- **API**: `http://localhost:3000/api/pattern-discovery`

### Portfolio Simulation Reports
- **URL**: `http://localhost:3000/portfolio-simulation`
- **Latest Report**: `http://localhost:3000/portfolio-simulation/latest`
- **API**: `http://localhost:3000/api/portfolio-simulation`

### Archive Reports
- **URL**: `http://localhost:3000/archive`
- **AH Analysis**: `http://localhost:3000/archive/ah-analysis`
- **Static Files**: `http://localhost:3000/static/archive/`

### Odds Movement API
- **Records**: `http://localhost:3000/api/odds/records`
- **Search**: `http://localhost:3000/api/odds/records/search?home=Arsenal`
- **Matches**: `http://localhost:3000/api/odds/matches`

## 📁 Project Structure

```
src/web-server/
├── unified-server.js       # Main server file
├── start-server.js         # Startup script
└── README.md              # This file

Hosted Content:
├── src/pattern-discovery/dashboards/     # Interactive drilling interface
├── src/portfolio-simulation/             # Strategy reports
├── archive/ah-analysis/                  # Historical reports
├── webserver/webapp/                     # Svelte webapp (legacy)
└── data/odds-movement/                   # Odds data (watched)
```

## 🔧 Features

### Unified Hosting
- **All HTML reports** in one place
- **Single dashboard system** for pattern discovery
- **Static file serving** for all directories
- **RESTful APIs** for data access

### Real-time Updates
- **File watching** for odds movement data
- **Dynamic route handling** for new reports
- **API endpoints** for live data access

### Navigation
- **Professional interface** with modern design
- **Organized sections** for different analysis types
- **Direct links** to specific reports and tools

## 🛠 Development

### Adding New Reports
1. Place HTML files in appropriate directories:
   - Portfolio reports: `src/portfolio-simulation/`
   - Pattern analysis: `src/pattern-discovery/`
   - Archive: `archive/`

2. Files are automatically served via:
   - Direct file serving for static content
   - Route handlers for specific dashboard integration

### API Integration
- Pattern discovery data: `/api/pattern-discovery`
- Portfolio simulation data: `/api/portfolio-simulation`
- Odds movement data: `/api/odds/*`

### Port Configuration
- **Default port**: 3000
- **Configurable** in `unified-server.js`
- **No conflicts** with pattern discovery dashboard (port 8888)

## 📊 Dashboard Integration

### Pattern Discovery (Port 8888 → 3000)
- **Old**: Standalone server on port 8888
- **New**: Integrated into unified server
- **Interface**: Single drilling dashboard for factor exploration
- **Benefits**: Simplified interface, unified navigation

### Portfolio Simulation
- **Auto-detection** of latest reports
- **JSON API access** to raw data
- **Professional report hosting**

### Archive Reports
- **Historical analysis** preserved
- **Static file serving** for documents
- **Organized browsing** interface

## 🔄 Migration from Old Systems

### Before (Multiple Servers)
```bash
# Pattern discovery
cd src/pattern-discovery && node launch_dashboards.js  # Port 8888

# Original webserver
cd webserver && node server.js                        # Port 3000

# Portfolio reports (manual file opening)
open src/portfolio-simulation/strategy_report_*.html
```

### After (Unified Server)
```bash
# Everything in one place
node src/web-server/start-server.js                   # Port 3000

# Access everything via browser
open http://localhost:3000
```

## 🎯 Benefits

### For Users
- **Single URL** to remember
- **Simplified navigation** with focused drill interface
- **No port conflicts** or multiple servers
- **Consistent styling** across reports

### For Development
- **Centralized hosting** logic
- **Easy addition** of new reports
- **Unified API structure**
- **Better organization** of web assets

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill existing processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in unified-server.js
const PORT = 3001;
```

### Missing Reports
- Check file paths in `unified-server.js`
- Verify directory structure matches expectations
- Run report generators to create missing files

### API Errors
- Ensure data directories exist
- Check file permissions
- Verify JSON file formats

## 📝 Logs

Server logs include:
- **Startup information** with all available URLs
- **API data loading** progress
- **File watching** events for odds data
- **Error messages** for debugging

## 🎉 Success!

Your project now has a **unified web interface** that consolidates:
- ✅ Pattern discovery drill dashboard
- ✅ Portfolio simulation reports  
- ✅ Historical archive access
- ✅ Odds movement APIs
- ✅ Professional navigation

**One server, all your analysis tools!** 