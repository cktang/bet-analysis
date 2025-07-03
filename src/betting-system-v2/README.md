# Betting System V2

This directory contains the new version 2 architecture of the betting system, designed to solve common maintenance issues with inter-module communication and dependencies.

## 🎯 Key Benefits

- **🔄 Event-Driven Architecture**: Modules communicate through events, not direct calls
- **💉 Dependency Injection**: Centralized dependency management eliminates tight coupling  
- **⚙️ Centralized Configuration**: No more scattered config files
- **🧩 Modular Design**: Clear separation of concerns with defined interfaces
- **🔧 Easy Testing**: Mock dependencies and isolated unit tests
- **📈 Scalable**: Add new services without breaking existing ones

## 🏗️ Architecture Overview

```
src/betting-system-v2/
├── core/                 # 🧠 Core framework components
│   ├── EventBus.ts       # Event-driven communication
│   ├── Container.ts      # Dependency injection
│   ├── ConfigManager.ts  # Centralized configuration
│   ├── BaseService.ts    # Base class for all services
│   └── index.ts
├── services/             # 🔧 Business logic services
│   ├── BettingService.ts # Example betting service
│   └── index.ts
├── examples/             # 📖 Usage examples
│   └── basic-usage.ts
├── models/               # 📊 Data models
├── controllers/          # 🌐 Request handlers
├── types/                # 📝 TypeScript definitions
├── utils/                # 🛠️ Utility functions
├── config/               # ⚙️ Configuration files
├── index.ts              # Main entry point
└── README.md
```

## 🚀 Quick Start

```typescript
import { createBettingSystem, ServiceKeys } from './src/betting-system-v2';

// 1. Create and start the system
const system = createBettingSystem();
await system.start();

// 2. Get services through dependency injection
const bettingService = await system.getService(ServiceKeys.BETTING_SERVICE);

// 3. Use event-driven communication
const eventBus = system.getEventBus();
eventBus.on('bet.placed', (data) => {
  console.log('Bet placed:', data);
});

// 4. Place a bet
const result = await bettingService.placeBet({
  matchId: 'epl_2024_arsenal_vs_chelsea',
  betType: 'handicap',
  amount: 100,
  odds: 1.85,
  league: 'Eng Premier',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea'
});

// 5. Clean shutdown
await system.stop();
```

## 🔄 Event-Driven Communication

Instead of modules directly calling each other:

```typescript
// ❌ OLD WAY - Direct coupling
import { bettingService } from './betting-service';  
import { userService } from './user-service';

// Services directly depend on each other
bettingService.placeBet(bet);
userService.updateBalance(userId, amount);
```

```typescript
// ✅ NEW WAY - Event-driven
eventBus.emit('bet.placed', { bet, userId, amount });

// Services listen for relevant events
eventBus.on('bet.placed', (data) => {
  userService.updateBalance(data.userId, data.amount);
});
```

## 💉 Dependency Injection

Instead of scattered imports and tight coupling:

```typescript
// ❌ OLD WAY - Scattered dependencies
const config = require('./config/teams.js');
const utils = require('../utils/helpers.js');
const database = require('./database.js');
```

```typescript
// ✅ NEW WAY - Centralized container
class BettingService extends BaseService {
  async onInitialize() {
    // Dependencies injected automatically
    this.config = await this.getDependency(ServiceKeys.CONFIG_MANAGER);
    this.database = await this.getDependency(ServiceKeys.DATABASE);
  }
}
```

## ⚙️ Centralized Configuration

Instead of multiple config files:

```typescript
// ❌ OLD WAY - Scattered config
const teams = require('./teams.js');        // 390 lines
const leagues = require('./leagues.js');
const settings = require('./settings.js');
```

```typescript
// ✅ NEW WAY - Centralized config
const config = system.getConfig();
const teams = config.getTeams('Eng Premier', '2024-2025');
const leagues = config.getLeagueNames();
```

## 🧩 Creating New Services

1. **Extend BaseService**:
```typescript
export class MyService extends BaseService {
  public readonly name = 'MyService';
  
  protected async onInitialize(): Promise<void> {
    // Setup service
    this.on('relevant.event', this.handleEvent.bind(this));
  }
  
  protected async onShutdown(): Promise<void> {
    // Cleanup
  }
}
```

2. **Register in Container**:
```typescript
container.registerSingleton(ServiceKeys.MY_SERVICE, () => new MyService(container));
```

3. **Use Anywhere**:
```typescript
const myService = await system.getService(ServiceKeys.MY_SERVICE);
```

## 🔧 Testing

Mock dependencies easily:

```typescript
const mockContainer = new Container();
mockContainer.registerSingleton(ServiceKeys.CONFIG_MANAGER, () => mockConfig);
mockContainer.registerSingleton(ServiceKeys.EVENT_BUS, () => mockEventBus);

const service = new BettingService(mockContainer);
// Test in isolation
```

## 📚 Examples

Run the basic example:
```typescript
import { runBasicExample } from './examples/basic-usage';
await runBasicExample();
```

## 🛠️ Development Guidelines

1. **Services**: Extend `BaseService` for consistent behavior
2. **Events**: Use meaningful event names (`service.action`, e.g., `bet.placed`)
3. **Dependencies**: Register all dependencies in the container
4. **Configuration**: Use `ConfigManager` for all settings
5. **Logging**: Use the built-in logging methods with proper levels
6. **Error Handling**: Use `safeExecute` and `retry` helpers

## 🔍 Troubleshooting

- **Service not found**: Make sure it's registered in the container
- **Event not firing**: Check event name spelling and listeners
- **Config not loaded**: Verify config structure matches interfaces
- **Circular dependencies**: Use events instead of direct service calls

This architecture eliminates the maintenance nightmares of scattered files, direct dependencies, and tight coupling while providing a clean, scalable foundation for your betting system.