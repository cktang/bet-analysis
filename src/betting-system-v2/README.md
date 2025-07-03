# Betting System V2

This directory contains the new version 2 architecture of the betting system, organized in a clean modular structure.

## Directory Structure

```
src/betting-system-v2/
├── index.ts              # Main entry point
├── models/               # Data models and entities
│   └── index.ts
├── services/             # Business logic services
│   └── index.ts
├── controllers/          # Request handlers and controllers
│   └── index.ts
├── types/                # TypeScript type definitions
│   └── index.ts
├── utils/                # Utility functions and helpers
│   └── index.ts
├── config/               # Configuration files
└── README.md
```

## Getting Started

The main entry point is `index.ts` which exports the `BettingSystemV2` class:

```typescript
import BettingSystemV2 from './src/betting-system-v2';

const system = new BettingSystemV2();
await system.start();
```

## Architecture

- **Models**: Data structures and database models
- **Services**: Business logic and core functionality
- **Controllers**: API endpoints and request handling
- **Types**: TypeScript interfaces and type definitions
- **Utils**: Shared utility functions
- **Config**: Configuration management

## Development

Each directory has its own `index.ts` file for clean imports and exports. Add new files to the appropriate directory and export them through the index file.