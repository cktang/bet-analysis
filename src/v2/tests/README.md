# V2 System Testing Documentation

## Overview

This directory contains comprehensive test suites for the V2 Live Betting System, focusing on shared services architecture, file-based communication, and factor drilling integration.

## Test Structure

```
tests/
├── README.md                 # This file
├── jest.config.js            # Jest configuration
├── setup.ts                  # Global test setup
├── run-tests.sh             # Test runner script
├── unit/                    # Unit tests for individual services
│   ├── shared-browser.service.test.ts
│   ├── betting-utilities.service.test.ts
│   ├── data-file.service.test.ts
│   ├── odds-monitor.service.test.ts
│   ├── betting-decision.service.test.ts
│   └── betting-executor.service.test.ts
├── integration/             # Integration tests for complete workflows
│   ├── file-based-communication.test.ts
│   ├── shared-services.test.ts
│   └── live-trading-pipeline.test.ts
└── e2e/                     # End-to-end tests
    ├── factor-drilling.test.ts
    └── betting-automation.test.ts
```

## Running Tests

### Quick Start
```bash
# Run all V2 tests
npm run test:v2

# Run specific test categories
npm run test:v2:unit
npm run test:v2:integration
npm run test:v2:e2e

# Run with coverage
npm run test:v2:coverage
```

### Manual Test Execution
```bash
# From project root
./src/v2/tests/run-tests.sh

# Individual test files
npx jest src/v2/tests/unit/shared-browser.service.test.ts
npx jest src/v2/tests/integration/file-based-communication.test.ts
```

## Test Categories

### 1. Unit Tests (`unit/`)

Tests individual services in isolation with mocked dependencies, focusing on the shared services architecture.

**Core Services Coverage:**
- ✅ **SharedBrowserService** - Browser instance management, isolation, login/logout
- ✅ **BettingUtilitiesService** - Common betting logic, validation, season collision prevention
- ✅ **DataFileService** - File operations, configuration management, JSON handling

**Live Trading Services Coverage:**
- ✅ **OddsMonitorService** - Real-time odds monitoring with shared browser
- ✅ **BettingDecisionService** - Strategy evaluation and file watching
- ✅ **BettingExecutorService** - Automated betting with duplicate prevention

**Key Test Scenarios:**
- Service initialization and dependency injection
- Shared service interaction patterns
- File-based communication mechanisms
- Browser instance isolation
- Season collision prevention
- Configuration-driven behavior

### 2. Integration Tests (`integration/`)

Tests complete workflows and service interactions in the shared services architecture.

**Coverage:**
- ✅ **File-Based Communication** - Complete JSON file exchange workflow
- ✅ **Shared Services Integration** - Cross-service dependency validation
- ✅ **Live Trading Pipeline** - End-to-end betting automation
- ✅ **Browser Instance Management** - Isolated browser instance coordination
- ✅ **Season Collision Prevention** - Multi-season match identification safety

**Key Test Scenarios:**
- Complete automated trading cycle with file communication
- Shared browser service coordination across multiple services
- Data consistency across file-based communication
- Error recovery and fallback mechanisms
- Performance metric calculation
- System health monitoring

### 3. End-to-End Tests (`e2e/`)

Tests complete user workflows and system integration.

**Coverage:**
- ✅ **Factor Drilling Interface** - Interactive drilling workflow
- ✅ **Betting Automation** - Complete betting cycle from odds to execution
- ✅ **System Integration** - NestJS application with all services

**Key Test Scenarios:**
- Factor drilling interface navigation and functionality
- Complete betting automation workflow
- System startup and service coordination
- Error handling across entire system
- Performance under load

## Test Data and Mocking

### Mock Data Strategy
- **Consistent Mock Data**: All tests use standardized mock data for predictability
- **Realistic Scenarios**: Mock data represents real EPL matches and betting scenarios
- **Edge Case Coverage**: Tests include error conditions, empty data, and boundary conditions
- **Season Collision Testing**: Multiple seasons with identical fixtures

### Key Mock Objects
```typescript
// Shared Browser Service Mock
const mockBrowserConfig = {
  headless: true,
  timeout: 30000,
  userDataDir: './test-browser-profile',
  debuggingPort: 9999,
  userAgent: 'TestAgent'
};

// File Communication Mock
const mockOddsData = {
  timestamp: new Date().toISOString(),
  matches: [
    {
      matchId: 'test_match_1',
      homeTeam: 'Arsenal',
      awayTeam: 'Liverpool',
      homeOdds: 2.40,
      awayOdds: 2.90,
      handicap: -0.5,
      kickoffTime: new Date('2025-07-04T15:00:00Z').toISOString()
    }
  ]
};

// Betting Decision Mock
const mockBettingDecision = {
  id: 'decision_test_123',
  matchId: 'test_match_1',
  homeTeam: 'Arsenal',
  awayTeam: 'Liverpool',
  strategyName: 'Single_awayGoalDiff',
  betSide: 'away',
  stake: 200,
  odds: 2.90,
  handicap: 0.5,
  kickoffTime: new Date('2025-07-04T15:00:00Z').toISOString(),
  timestamp: new Date().toISOString()
};

// Season Collision Prevention Mock
const mockSeasonCollisionData = {
  '2022-23_Southampton v Arsenal': 'Early season match',
  '2023-24_Southampton v Arsenal': 'Mid season match',
  '2024-25_Southampton v Arsenal': 'Current season match'
};
```

## Coverage Targets

The test suite maintains high coverage standards:

- **Branches**: 85%
- **Functions**: 85%  
- **Lines**: 85%
- **Statements**: 85%

## Test Environment Configuration

### Environment Variables
```bash
NODE_ENV=test                    # Test environment flag
ENABLE_LIVE_BETTING=false       # Disable live betting in tests
ENABLE_PAPER_TRADING=true       # Enable paper trading mode
BASE_STAKE=100                   # Test betting amounts
CONFIDENCE_THRESHOLD=0.6         # Strategy confidence threshold
TEST_BROWSER_HEADLESS=true       # Run browsers in headless mode
```

### Dependencies
- **@nestjs/testing**: NestJS testing utilities and dependency injection
- **jest**: Test framework with TypeScript support
- **ts-jest**: TypeScript compilation for Jest
- **playwright**: Browser automation for testing
- **chokidar**: File watching for communication tests

## Test Best Practices

### 1. Shared Services Testing
- Test services in isolation with proper mocking
- Validate dependency injection patterns
- Test shared service coordination
- Verify error handling across service boundaries

### 2. File-Based Communication Testing
- Test file watching and event handling
- Validate JSON serialization/deserialization
- Test concurrent file access scenarios
- Verify data persistence and recovery

### 3. Browser Instance Testing
- Test isolated browser instance creation
- Validate browser profile separation
- Test concurrent browser operations
- Verify cleanup and resource management

### 4. Season Collision Prevention Testing
- Test match key generation with multiple seasons
- Validate duplicate prevention logic
- Test edge cases with identical fixtures
- Verify catastrophic error prevention

## Continuous Integration

The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Run V2 Tests
  run: npm run test:v2:coverage
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    
- name: Test Report
  uses: dorny/test-reporter@v1
  if: success() || failure()
  with:
    name: V2 System Tests
    path: test-results.xml
    reporter: jest-junit
```

## Debugging Tests

### Running Individual Tests
```bash
# Single test file with verbose output
npx jest src/v2/tests/unit/shared-browser.service.test.ts --verbose

# Test specific shared service functionality
npx jest -t "should manage isolated browser instances"

# Debug mode with breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues
1. **Mock Setup**: Ensure all shared services are properly mocked
2. **File System Operations**: Use proper temp directories for file-based tests
3. **Browser Automation**: Verify Playwright configuration for headless testing
4. **Dependency Injection**: Check NestJS testing module configuration
5. **Async Operations**: Use proper async/await for file operations and browser actions

## Testing Patterns

### Shared Services Pattern Testing
```typescript
describe('SharedBrowserService', () => {
  let service: SharedBrowserService;
  let mockDataFileService: jest.Mocked<DataFileService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedBrowserService,
        {
          provide: DataFileService,
          useValue: mockDataFileService
        }
      ]
    }).compile();

    service = module.get<SharedBrowserService>(SharedBrowserService);
  });

  it('should create isolated browser instances', async () => {
    const instance1 = await service.getPageInstance('Service1', mockConfig);
    const instance2 = await service.getPageInstance('Service2', mockConfig);
    
    expect(instance1).toBeDefined();
    expect(instance2).toBeDefined();
    expect(instance1).not.toBe(instance2);
  });
});
```

### File-Based Communication Testing
```typescript
describe('File-Based Communication', () => {
  let tempDir: string;
  let dataFileService: DataFileService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
    dataFileService = new DataFileService(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('should handle file watching and updates', async () => {
    const filePath = path.join(tempDir, 'test-data.json');
    const watchPromise = new Promise((resolve) => {
      const watcher = chokidar.watch(filePath);
      watcher.on('change', resolve);
    });

    await dataFileService.writeFile('test-data.json', { test: 'data' });
    
    await expect(watchPromise).resolves.toBeDefined();
  });
});
```

## Future Enhancements

### Planned Test Additions
- [ ] Performance testing for file-based communication under load
- [ ] Chaos engineering for shared service resilience
- [ ] Security testing for browser automation
- [ ] Load testing for concurrent betting operations
- [ ] Contract testing for service interfaces

### Test Infrastructure Improvements
- [ ] Test data factories for complex shared service scenarios
- [ ] Visual regression testing for factor drilling interface
- [ ] Test environment containerization with Docker
- [ ] Automated test result reporting and analytics
- [ ] Performance benchmarking for shared services

## Contributing

When adding new features to the V2 system:

1. **Write tests first** (TDD approach) for shared services
2. **Maintain coverage** above 85% thresholds
3. **Test shared service interactions** not just individual services
4. **Validate file-based communication** in integration tests
5. **Update this documentation** with new test scenarios
6. **Run full test suite** before submitting changes

## Support

For test-related issues:
- Check shared service dependency injection setup
- Verify file-based communication mock configuration
- Review browser instance isolation settings
- Consult NestJS testing documentation for dependency injection
- Check Playwright documentation for browser automation testing

---

*This documentation reflects the current V2 system architecture with shared services pattern and file-based communication.*