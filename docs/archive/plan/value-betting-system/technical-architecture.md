# Technical Architecture: Multi-Browser Odds Monitoring System

## System Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Pinnacle      │    │      HKJC       │    │   Other Books   │
│   Scraper       │    │    Scraper      │    │   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │            Data Aggregator                  │
         └─────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │         Probability Calculator              │
         │    (Margin Removal & EV Calculation)        │
         └─────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │           Value Detector                    │
         │      (Opportunity Identification)           │
         └─────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │          Alert System                       │
         │    (Notifications & Execution Signals)      │
         └─────────────────────────────────────────────┘
```

## Core Components

### 1. Multi-Browser Monitoring System

#### Browser Pool Management
- **Pinnacle Monitor**: Dedicated Playwright instance
- **HKJC Monitor**: Dedicated Playwright instance  
- **Backup Browsers**: Failover capabilities
- **Proxy Rotation**: Geographic access management

#### Real-time Data Collection
```javascript
// Continuous monitoring loop
setInterval(async () => {
    const pinnacleData = await scrapePinnacle();
    const hkjcData = await scrapeHKJC();
    
    await processOddsUpdate(pinnacleData, hkjcData);
}, 5000); // 5-second intervals
```

### 2. Data Processing Pipeline

#### Odds Normalization
- Convert all odds to decimal format
- Standardize market types (Asian Handicap)
- Match events across platforms

#### Change Detection
- Track odds movements
- Identify significant changes (>2% implied probability shift)
- Calculate velocity of movement

### 3. Value Calculation Engine

#### Margin Removal
```javascript
function removeMargin(impliedProb, estimatedMargin) {
    return impliedProb / (1 + estimatedMargin);
}

// Pinnacle: ~2.5% margin
// HKJC: ~5% margin (estimated)
```

#### Expected Value Calculation
```javascript
function calculateEV(bookOdds, trueProbability) {
    return (bookOdds * trueProbability) - 1;
}
```

### 4. Alert & Notification System

#### Trigger Conditions
- EV threshold exceeded (>3%)
- Large odds discrepancy (>10% difference)
- Rapid line movement detected

#### Notification Channels
- Real-time alerts (Telegram/Discord)
- Email notifications
- SMS for high-value opportunities
- Dashboard updates

## Technical Implementation

### Browser Management
```javascript
// browser-manager.js
class BrowserManager {
    constructor() {
        this.browsers = new Map();
        this.proxies = [];
    }
    
    async initializeBrowsers() {
        // Pinnacle browser
        this.browsers.set('pinnacle', await chromium.launch({
            headless: true,
            proxy: this.getProxy('pinnacle')
        }));
        
        // HKJC browser
        this.browsers.set('hkjc', await chromium.launch({
            headless: true,
            proxy: this.getProxy('hkjc')
        }));
    }
    
    async rotateBrowsers() {
        // Periodic browser restart to avoid detection
        // Proxy rotation
        // Session management
    }
}
```

### Data Collection Strategy
```javascript
// odds-collector.js
class OddsCollector {
    async collectPinnacleOdds() {
        const page = this.browsers.get('pinnacle').newPage();
        
        // Navigate to Asian Handicap markets
        await page.goto('https://pinnacle.com/asian-handicap');
        
        // Extract odds data
        const odds = await page.evaluate(() => {
            // DOM extraction logic
        });
        
        return this.normalizeOdds(odds, 'pinnacle');
    }
    
    async collectHKJCOdds() {
        // Similar implementation for HKJC
    }
}
```

### Real-time Processing
```javascript
// value-detector.js
class ValueDetector {
    processOddsUpdate(pinnacleOdds, hkjcOdds) {
        const matches = this.matchEvents(pinnacleOdds, hkjcOdds);
        
        matches.forEach(match => {
            const value = this.calculateValue(match);
            if (value.ev > this.threshold) {
                this.alertSystem.notify(value);
            }
        });
    }
    
    calculateValue(match) {
        const pinnacleTrue = removeMargin(
            match.pinnacle.impliedProb, 
            0.025
        );
        
        const hkjcEV = calculateEV(
            match.hkjc.odds, 
            pinnacleTrue
        );
        
        return {
            match: match.id,
            ev: hkjcEV,
            confidence: this.calculateConfidence(match)
        };
    }
}
```

## Infrastructure Requirements

### Server Specifications
- **CPU**: 8+ cores (multiple browser instances)
- **RAM**: 16GB+ (browser memory usage)
- **Storage**: SSD for fast data processing
- **Network**: High-speed, low-latency connection

### Scalability Considerations
- **Horizontal scaling**: Multiple server instances
- **Load balancing**: Distribute monitoring across nodes
- **Failover mechanisms**: Automatic recovery
- **Data synchronization**: Real-time state sharing

## Security & Compliance

### Anti-Detection Measures
- User-agent rotation
- Behavioral simulation
- Request timing randomization
- Cookie management

### Data Protection
- Encrypted data storage
- Secure API communications
- Access logging
- Compliance with data protection laws

## Monitoring & Maintenance

### System Health Checks
- Browser availability monitoring
- Data collection success rates
- Alert system functionality
- Performance metrics

### Automated Maintenance
- Daily browser restarts
- Proxy rotation schedules
- Log cleanup
- Performance optimization

---
*This architecture requires significant technical expertise and careful legal compliance.* 