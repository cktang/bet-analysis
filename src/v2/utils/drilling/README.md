# Shared Drilling Utilities

This directory contains shared JavaScript utilities for the drilling functionality that can be used by both the client-side drilling tool and server-side NestJS services.

## Files

### Core Calculation Logic
- **`CalculationEngine.js`** - Main calculation engine for betting analysis, risk metrics, and performance caching
- **`UtilityHelper.js`** - Pure utility functions for data processing, formatting, and factor evaluation
- **`StrategyManager.js`** - Strategy persistence and management logic (client-side storage, can be extended for server-side)
- **`AsianHandicapCalculator.js`** - Core Asian Handicap calculation utility (single source of truth for all AH calculations)
- **`bettinganalysisutils.js`** - Core betting analysis utilities (factor evaluation, match filtering, betting calculations)

### Configuration
- **`factor_definitions.json`** - **🎯 GOLDEN SOURCE** - Factor definitions and expressions used by the drilling system

## Usage

### Client-Side (Drilling Tool)
The drilling tool loads these files via the `/utils/drilling/` static file endpoint, which serves directly from this shared directory.

### Server-Side (NestJS)
These utilities can be imported and used in NestJS services to avoid code duplication:

```typescript
// Example: Using CalculationEngine in a NestJS service
import { CalculationEngine } from '../utils/drilling/CalculationEngine.js';

@Injectable()
export class MyService {
  private calculationEngine = new CalculationEngine();
  
  async analyzeStrategy(factors: any[], sideSelection: any, sizeSelection: any) {
    // Use the same calculation logic as the client-side
    return await this.calculationEngine.calculateBettingResults(matches, sideSelection, sizeSelection);
  }
}
```

## Migration Notes

- These files were moved from `src/v2/analysis/drilling-tool/js/` to create a shared codebase
- The drilling tool now loads shared files from `/utils/drilling/` static endpoint
- Server-side services can now use the same gold-standard logic as the client-side
- All performance optimizations and caching systems are preserved
- Static file serving is configured in `nestjs-main.ts` using `app.useStaticAssets()`

## 🎯 Golden Source Rule - CRITICAL

**`factor_definitions.json`** in this directory is the **ONLY** authoritative source for factor definitions. 

### ✅ Correct Usage:
- **NestJS Services**: Use relative paths to `../utils/drilling/factor_definitions.json`
- **API Controllers**: Use `join(__dirname, '..', 'utils', 'drilling', 'factor_definitions.json')`
- **Frontend Apps**: Load via `/analysis/utils/drilling/factor_definitions.json`
- **Other locations**: Create symbolic links, never duplicate files

### ❌ NEVER Do This:
- Create copies of `factor_definitions.json` in other directories
- Hardcode factor definitions in code
- Load factor definitions from multiple sources
- Edit factor definitions anywhere except this golden source

## Next Steps

1. ✅ All services now point to the golden source
2. ✅ Symbolic links replace duplicate files  
3. Extend `StrategyManager` for server-side persistence (database instead of localStorage) 