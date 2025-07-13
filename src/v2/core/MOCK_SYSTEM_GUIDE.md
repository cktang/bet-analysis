# Mock System Guide - Single Control Point

## 🎭 **Overview**

This system uses **dependency injection** to switch between real and mock data services. There is **ONE control point** to switch between mock and real behavior.

## 🎯 **Single Control Point**

**File:** `src/v2/live-trading/index.ts`

**Control Line:**
```typescript
{
  provide: DATA_FILE_SERVICE,
  useClass: MockDataFileService,  // ← CHANGE THIS LINE
}
```

## 🔄 **How to Switch**

### **For MOCK Mode (Testing/Development):**
```typescript
{
  provide: DATA_FILE_SERVICE,
  useClass: MockDataFileService,
}
```

### **For REAL Mode (Production):**
```typescript
{
  provide: DATA_FILE_SERVICE,
  useClass: DataFileService,
}
```

## 📊 **What's Mocked vs Real**

### **🎭 MOCKED (Always Returns Test Data):**
- **Strategies**: Always returns $10 stake strategies
  - Home strategy for odd FB IDs
  - Away strategy for even FB IDs
- **Browser Configuration**: `headless: false` (browser visible for testing)
- **System Configuration**: Paper trading enabled, live betting disabled
- **Bet Records**: Empty arrays
- **Bet Results**: Empty arrays
- **Logs**: Console output only

### **✅ REAL (Reads Actual Files):**
- **Fixtures**: Reads from `data/v2/fixture.json`
- **Browser Configuration**: `headless: true` (browser hidden for production)
- **System Configuration**: Live betting enabled, paper trading disabled
- **File Operations**: Delegates to real file system for fixtures

### **🔄 HYBRID:**
- **Odds Data**: Uses real fixtures but wraps in mock structure

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    LiveTradingModule                        │
├─────────────────────────────────────────────────────────────┤
│  DATA_FILE_SERVICE Token                                    │
│  ├─ MockDataFileService (MOCK MODE)                        │
│  └─ DataFileService (REAL MODE)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              StrategyDecisionService                        │
│              BettingExecutorService                         │
│              ResultsTrackerService                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎮 **Mock Strategies**

The mock system provides two strategies that bet on **every match**:

### **Mock-Strategy-Home**
- **Condition**: `parseInt(match.fbId) % 2 === 1` (Odd FB IDs)
- **Bet Side**: Home
- **Stake**: $10 (fixed)

### **Mock-Strategy-Away**
- **Condition**: `parseInt(match.fbId) % 2 === 0` (Even FB IDs)
- **Bet Side**: Away
- **Stake**: $10 (fixed)

## 📝 **Mock Data Structure**

### **Mock Strategies:**
```json
[
  {
    "name": "Mock-Strategy-Home",
    "side": { "betSide": "home" },
    "size": { "expression": "10", "stakingMethod": "fixed" },
    "factors": [
      {
        "key": "mock",
        "expression": "parseInt(match.fbId) % 2 === 1",
        "description": "Mock factor for odd FB IDs"
      }
    ]
  },
  {
    "name": "Mock-Strategy-Away",
    "side": { "betSide": "away" },
    "size": { "expression": "10", "stakingMethod": "fixed" },
    "factors": [
      {
        "key": "mock",
        "expression": "parseInt(match.fbId) % 2 === 0",
        "description": "Mock factor for even FB IDs"
      }
    ]
  }
]
```

## 🔧 **Implementation Details**

### **MockDataFileService Methods:**
- `getStrategies()` → Returns mock strategies
- `getFixtures()` → Reads real `fixture.json`
- `getOdds()` → Wraps real fixtures in mock structure
- `getBetRecords()` → Returns empty array
- `getBetResults()` → Returns empty array
- `getBrowserConfig()` → Returns `{headless: false}` for visible browser
- `getSystemConfig()` → Returns mock system settings
- `writeFile()` → Logs to console (no file writing)
- `appendToFile()` → Logs to console (no file writing)

### **Real File Delegation:**
```typescript
private async readRealFile<T>(filename: string): Promise<T[]> {
  // Reads from actual data/v2/ directory
  // Falls back to empty array if file doesn't exist
}
```

## 🚀 **Usage Examples**

### **Testing with Mock Data:**
1. Set `useClass: MockDataFileService` in `index.ts`
2. Start the system
3. All matches will be bet on with $10 stakes
4. Check console logs for bet activity

### **Production with Real Data:**
1. Set `useClass: DataFileService` in `index.ts`
2. Ensure `data/v2/strategy.json` exists with real strategies
3. System uses actual betting logic

## ⚠️ **Important Notes**

1. **Single Control Point**: Only change the `useClass` line in `index.ts`
2. **No Other Changes Needed**: All services automatically use the injected data service
3. **Real Fixtures**: Mock mode still uses real fixture data for realistic testing
4. **Console Logging**: Mock mode logs all operations to console instead of files
5. **No File Pollution**: Mock mode doesn't write to actual data files

## 🔍 **Monitoring**

### **Mock Mode Console Output:**
```
🎭 MockDataFileService: Reading strategy.json
🎭 MockDataFileService: Reading fixture.json
🎭 MockDataFileService: Writing betting-decisions.json with 2 records
🟢 MOCK: Betting on match FB123 (Arsenal vs Liverpool) - Side: home, Stake: $10
```

### **Real Mode File Output:**
- Writes to actual `data/v2/` files
- Uses real strategy logic
- Processes actual betting decisions

## 🎯 **Quick Reference**

| Mode | Control Line | Fixtures | Strategies | Browser | Betting |
|------|-------------|----------|------------|---------|---------|
| **Mock** | `MockDataFileService` | Real | Mock ($10) | Visible | Every match |
| **Real** | `DataFileService` | Real | Real | Headless | Strategy-based |

**Remember: ONE LINE CHANGE = COMPLETE MODE SWITCH** 