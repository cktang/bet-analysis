# Implementation Plan: Value Betting System

## Project Structure
```
value-betting-system/
├── README.md
├── technical-architecture.md
├── implementation-plan.md
├── src/
│   ├── collectors/
│   │   ├── pinnacle-scraper.js
│   │   ├── hkjc-scraper.js
│   │   └── base-scraper.js
│   ├── processors/
│   │   ├── odds-normalizer.js
│   │   ├── probability-calculator.js
│   │   └── value-detector.js
│   ├── infrastructure/
│   │   ├── browser-manager.js
│   │   ├── data-storage.js
│   │   └── alert-system.js
│   ├── utils/
│   │   ├── math-helpers.js
│   │   ├── logger.js
│   │   └── config.js
│   └── main.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── data/
├── config/
│   ├── development.json
│   ├── production.json
│   └── proxies.json
├── scripts/
│   ├── setup.js
│   ├── deploy.js
│   └── monitor.js
└── package.json
```

## Phase 1: Foundation (Week 1-2)

### Objectives
- Set up basic project structure
- Implement core browser management
- Create basic odds collection framework

### Deliverables
1. **Project Setup**
   - Initialize Node.js project with dependencies
   - Set up testing framework (Jest)
   - Configure development environment

2. **Browser Management System**
   ```javascript
   // src/infrastructure/browser-manager.js
   class BrowserManager {
       constructor(config) {
           this.config = config;
           this.browsers = new Map();
           this.isRunning = false;
       }
       
       async initialize() {
           // Create browser instances for each site
           await this.createBrowser('pinnacle');
           await this.createBrowser('hkjc');
       }
       
       async createBrowser(site) {
           const browser = await chromium.launch({
               headless: true,
               args: ['--no-sandbox', '--disable-setuid-sandbox']
           });
           this.browsers.set(site, browser);
       }
   }
   ```

3. **Base Scraper Class**
   ```javascript
   // src/collectors/base-scraper.js
   class BaseScraper {
       constructor(browserManager, site) {
           this.browserManager = browserManager;
           this.site = site;
           this.page = null;
       }
       
       async initialize() {
           const browser = this.browserManager.getBrowser(this.site);
           this.page = await browser.newPage();
       }
       
       async scrapeOdds() {
           // Override in child classes
           throw new Error('Must implement scrapeOdds method');
       }
   }
   ```

### Success Criteria
- [ ] Browser instances successfully created
- [ ] Basic page navigation working
- [ ] Logging system operational
- [ ] Unit tests passing

## Phase 2: Data Collection (Week 3-4)

### Objectives
- Implement site-specific scrapers
- Create odds normalization system
- Build data storage layer

### Deliverables
1. **Pinnacle Scraper**
   ```javascript
   // src/collectors/pinnacle-scraper.js
   class PinnacleScraper extends BaseScraper {
       async scrapeOdds() {
           await this.page.goto('https://pinnacle.com/asian-handicap');
           
           const odds = await this.page.evaluate(() => {
               const matches = [];
               document.querySelectorAll('.match-row').forEach(row => {
                   // Extract match data
                   matches.push({
                       teams: this.extractTeams(row),
                       handicap: this.extractHandicap(row),
                       odds: this.extractOdds(row),
                       timestamp: Date.now()
                   });
               });
               return matches;
           });
           
           return this.normalizeOdds(odds);
       }
   }
   ```

2. **HKJC Scraper**
   ```javascript
   // src/collectors/hkjc-scraper.js
   class HKJCScraper extends BaseScraper {
       async scrapeOdds() {
           await this.page.goto('https://bet.hkjc.com/football/asian-handicap');
           
           // Similar implementation with HKJC-specific selectors
           const odds = await this.page.evaluate(() => {
               // HKJC-specific DOM extraction
           });
           
           return this.normalizeOdds(odds);
       }
   }
   ```

3. **Data Storage**
   ```javascript
   // src/infrastructure/data-storage.js
   class DataStorage {
       constructor() {
           this.sqlite = new Database('./data/odds.db');
           this.initializeDB();
       }
       
       async storeOdds(odds, source) {
           const stmt = this.sqlite.prepare(`
               INSERT INTO odds (source, match_id, team_home, team_away, 
                               handicap, odds_home, odds_away, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           `);
           
           odds.forEach(match => {
               stmt.run(source, match.id, match.teams.home, 
                       match.teams.away, match.handicap, 
                       match.odds.home, match.odds.away, 
                       match.timestamp);
           });
       }
   }
   ```

### Success Criteria
- [ ] Both scrapers collecting data successfully
- [ ] Odds normalization working correctly
- [ ] Data storage system operational
- [ ] Historical data collection started

## Phase 3: Value Detection (Week 5-6)

### Objectives
- Implement probability calculations
- Build value detection algorithms
- Create alert system

### Deliverables
1. **Probability Calculator**
   ```javascript
   // src/processors/probability-calculator.js
   class ProbabilityCalculator {
       static removeMargin(impliedProb, margin) {
           return impliedProb / (1 + margin);
       }
       
       static calculateEV(bookOdds, trueProbability) {
           return (bookOdds * trueProbability) - 1;
       }
       
       static oddsToImpliedProb(odds) {
           return 1 / odds;
       }
       
       static kellyBetSize(odds, probability, bankroll) {
           const ev = this.calculateEV(odds, probability);
           const kellyFraction = (odds * probability - 1) / (odds - 1);
           return Math.max(0, kellyFraction * bankroll * 0.25); // 25% Kelly
       }
   }
   ```

2. **Value Detector**
   ```javascript
   // src/processors/value-detector.js
   class ValueDetector {
       constructor(config) {
           this.minEV = config.minEV || 0.03; // 3% minimum EV
           this.calculator = new ProbabilityCalculator();
       }
       
       detectValue(pinnacleOdds, hkjcOdds) {
           const opportunities = [];
           
           // Match odds from both sources
           const matches = this.matchOdds(pinnacleOdds, hkjcOdds);
           
           matches.forEach(match => {
               const value = this.calculateMatchValue(match);
               if (value.ev > this.minEV) {
                   opportunities.push(value);
               }
           });
           
           return opportunities;
       }
       
       calculateMatchValue(match) {
           // Use Pinnacle as benchmark
           const pinnacleTrue = ProbabilityCalculator.removeMargin(
               match.pinnacle.impliedProb, 0.025
           );
           
           const hkjcEV = ProbabilityCalculator.calculateEV(
               match.hkjc.odds, pinnacleTrue
           );
           
           return {
               matchId: match.id,
               teams: match.teams,
               handicap: match.handicap,
               ev: hkjcEV,
               confidence: this.calculateConfidence(match),
               betSize: ProbabilityCalculator.kellyBetSize(
                   match.hkjc.odds, pinnacleTrue, 1000
               )
           };
       }
   }
   ```

3. **Alert System**
   ```javascript
   // src/infrastructure/alert-system.js
   class AlertSystem {
       constructor(config) {
           this.telegramBot = new TelegramBot(config.telegram.token);
           this.email = new EmailService(config.email);
       }
       
       async sendOpportunityAlert(opportunity) {
           const message = this.formatAlert(opportunity);
           
           // Send to multiple channels
           await this.telegramBot.sendMessage(
               config.telegram.chatId, message
           );
           
           if (opportunity.ev > 0.1) { // 10%+ EV
               await this.email.send({
                   subject: 'HIGH VALUE OPPORTUNITY',
                   body: message
               });
           }
       }
       
       formatAlert(opp) {
           return `
🚨 VALUE BET ALERT 🚨
Match: ${opp.teams.home} vs ${opp.teams.away}
Handicap: ${opp.handicap}
Expected Value: ${(opp.ev * 100).toFixed(2)}%
Confidence: ${opp.confidence}/10
Suggested Bet: $${opp.betSize.toFixed(2)}
           `;
       }
   }
   ```

### Success Criteria
- [ ] Value detection algorithm working
- [ ] Alert system sending notifications
- [ ] EV calculations verified
- [ ] Confidence scoring implemented

## Phase 4: Integration & Testing (Week 7-8)

### Objectives
- Integrate all components
- Comprehensive testing
- Performance optimization

### Deliverables
1. **Main Application**
   ```javascript
   // src/main.js
   class ValueBettingSystem {
       constructor() {
           this.browserManager = new BrowserManager(config);
           this.pinnacleScaper = new PinnacleScraper(this.browserManager, 'pinnacle');
           this.hkjcScraper = new HKJCScraper(this.browserManager, 'hkjc');
           this.valueDetector = new ValueDetector(config);
           this.alertSystem = new AlertSystem(config);
           this.dataStorage = new DataStorage();
       }
       
       async start() {
           await this.browserManager.initialize();
           await this.pinnacleScaper.initialize();
           await this.hkjcScraper.initialize();
           
           // Start monitoring loop
           this.monitoringLoop();
       }
       
       async monitoringLoop() {
           setInterval(async () => {
               try {
                   const pinnacleOdds = await this.pinnacleScaper.scrapeOdds();
                   const hkjcOdds = await this.hkjcScraper.scrapeOdds();
                   
                   // Store historical data
                   await this.dataStorage.storeOdds(pinnacleOdds, 'pinnacle');
                   await this.dataStorage.storeOdds(hkjcOdds, 'hkjc');
                   
                   // Detect value opportunities
                   const opportunities = this.valueDetector.detectValue(
                       pinnacleOdds, hkjcOdds
                   );
                   
                   // Send alerts
                   for (const opp of opportunities) {
                       await this.alertSystem.sendOpportunityAlert(opp);
                   }
                   
               } catch (error) {
                   console.error('Monitoring loop error:', error);
               }
           }, 10000); // Every 10 seconds
       }
   }
   ```

2. **Testing Suite**
   - Unit tests for all components
   - Integration tests for data flow
   - Performance benchmarks
   - Mock data for testing

3. **Monitoring Dashboard**
   - Real-time odds display
   - Value opportunity history
   - System health metrics
   - Performance statistics

### Success Criteria
- [ ] Full system integration working
- [ ] All tests passing
- [ ] Performance meets requirements
- [ ] Error handling robust

## Phase 5: Deployment & Optimization (Week 9-10)

### Objectives
- Deploy to production environment
- Optimize performance
- Implement monitoring

### Deliverables
1. **Production Deployment**
   - Server setup and configuration
   - Environment variable management
   - Process management (PM2)
   - Backup and recovery procedures

2. **Performance Optimization**
   - Parallel processing
   - Caching strategies
   - Database optimization
   - Memory management

3. **Monitoring & Maintenance**
   - System health monitoring
   - Automated alerting
   - Log analysis
   - Performance metrics

### Success Criteria
- [ ] System running stably in production
- [ ] Performance targets met
- [ ] Monitoring systems operational
- [ ] Documentation complete

## Timeline Summary

| Phase | Duration | Key Milestones |
|-------|----------|----------------|
| 1 | 2 weeks | Foundation setup |
| 2 | 2 weeks | Data collection |
| 3 | 2 weeks | Value detection |
| 4 | 2 weeks | Integration |
| 5 | 2 weeks | Deployment |
| **Total** | **10 weeks** | **Production ready** |

## Resource Requirements

### Technical
- Node.js development environment
- Multiple proxy servers
- Database server (SQLite/PostgreSQL)
- VPS with sufficient resources

### Human
- 1 Full-stack developer
- Access to legal/compliance advisor
- Testing and validation support

### Financial
- Server hosting costs
- Proxy service subscriptions
- Development tools and licenses
- Initial betting bankroll for testing

---
*This implementation plan provides a structured approach to building a production-ready value betting system.* 