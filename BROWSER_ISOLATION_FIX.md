# Browser Isolation Fix for Multiple NestJS Processes

## Problem Fixed
Multiple NestJS services were trying to use the same browser instance despite being configured for isolation, causing conflicts and resource sharing issues.

## Root Cause
1. **Port Conflicts**: Services were using similar debugging ports (9222, 9223)
2. **Profile Directory Conflicts**: Similar user data directory names
3. **Timing Issues**: All services started browsers simultaneously during `onModuleInit()`
4. **Mixed Browser Launch Methods**: Some used `chromium.launch()`, others used `chromium.launchPersistentContext()`
5. **Invalid Arguments**: Using `--user-data-dir` argument with `chromium.launch()` instead of `launchPersistentContext()`

## Solution Implemented

### 1. Unique Browser Configurations

Each service now has completely isolated browser configuration:

| Service | Profile Directory | Debug Port | User Agent | Launch Method |
|---------|-------------------|------------|------------|---------------|
| **OddsMonitorService** | `./data/v2/browser-odds-monitor` | `9225` | `OddsMonitor-Process` | `launchPersistentContext()` |
| **BettingExecutorService** | `./data/v2/browser-betting-executor` | `9224` | `BettingExecutor-Process` | `launchPersistentContext()` |
| **HkjcBrowserService** | `./data/v2/browser-hkjc-service` | `9226` | `HKJCService-Process` | `launchPersistentContext()` |

### 2. Staggered Initialization

Services now start browsers at different times to prevent startup conflicts:

```typescript
// OddsMonitorService - starts first
setTimeout(async () => {
  await this.initializeBrowser();
}, 1000); // 1 second delay

// BettingExecutorService - starts after odds monitor
setTimeout(async () => {
  await this.initializeBrowser(); 
}, 3000); // 3 second delay

// HkjcBrowserService - starts on demand (no automatic delay)
```

### 3. Enhanced Browser Arguments

Each browser instance includes isolation-specific arguments:

```typescript
args: [
  '--no-sandbox', 
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--disable-web-security',
  '--disable-features=VizDisplayCompositor',
  '--remote-debugging-port=UNIQUE_PORT', // Different for each service
  '--user-agent=SERVICE_SPECIFIC_AGENT',
  `--user-data-dir=${uniqueUserDataDir}`,
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--force-device-scale-factor=1'
]
```

## Browser Process Isolation

Now each service runs in a **completely separate browser context**:

1. **OddsMonitorService**: Persistent context for continuous odds monitoring
2. **BettingExecutorService**: Persistent context for bet execution with fresh login/logout
3. **HkjcBrowserService**: Persistent context for general HKJC operations

All services now use `chromium.launchPersistentContext(userDataDir, options)` for proper profile isolation.

## Testing the Fix

To verify the fix works:

1. **Start the NestJS application**
2. **Check console logs** for unique initialization messages:
   ```
   📊 ISOLATED odds monitor browser initialized (port 9225, profile: browser-odds-monitor)
   💰 ISOLATED betting browser process created (port 9224, profile: browser-betting-executor)
   🔍 ISOLATED HKJC browser service initialized (port 9226, profile: browser-hkjc-service)
   ```
3. **Verify separate profile directories** exist:
   ```
   ./data/v2/browser-odds-monitor/
   ./data/v2/browser-betting-executor/
   ./data/v2/browser-hkjc-service/
   ```
4. **Check process isolation** - each service should have its own browser process running

## Key Benefits

✅ **True Parallel Operation**: Each service can run independently without conflicts  
✅ **Resource Isolation**: No sharing of browser sessions, cookies, or state  
✅ **Port Isolation**: Each browser uses a unique debugging port  
✅ **Profile Isolation**: Separate user data directories prevent conflicts  
✅ **Timing Isolation**: Staggered startup prevents initialization race conditions  
✅ **Process Isolation**: Each browser runs in its own system process  

## Status
🎯 **FIXED**: Multiple browser instances now run in parallel with complete isolation