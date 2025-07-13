# V2 System Testing Documentation

## Overview

This directory contains comprehensive test suites for the V2 Live Betting System, including unit tests, integration tests, and Angular component tests.

## Test Structure

```
tests/
├── README.md                 # This file
├── jest.config.js            # Jest configuration
├── setup.ts                  # Global test setup
├── run-tests.sh             # Test runner script
├── unit/                    # Unit tests for individual services
│   ├── fixtures.service.test.ts
│   ├── odds-monitor.service.test.ts
│   └── strategy-decision.service.test.ts
├── integration/             # Integration tests for complete workflows
│   └── live-trading-pipeline.test.ts
└── angular/                 # Angular component and service tests
    ├── fixtures.component.test.ts
    └── api.service.test.ts
```

## Running Tests

### Quick Start
```bash
# Run all V2 tests
npm run test:v2

# Run specific test categories
npm run test:v2:unit
npm run test:v2:integration
npm run test:v2:angular

# Run with coverage
npm run test:v2:coverage
```

### Manual Test Execution
```bash
# From project root
./src/v2/tests/run-tests.sh

# Individual test files
npx jest src/v2/tests/unit/fixtures.service.test.ts
npx jest src/v2/tests/integration/live-trading-pipeline.test.ts
```

## Test Categories

### 1. Unit Tests (`unit/`)

Tests individual services in isolation with mocked dependencies.

**Coverage:**
- ✅ **FixtureService** - Fixture loading, trading window detection, mock data fallback
- ✅ **OddsMonitorService** - Odds monitoring, change detection, EPL team filtering
- ✅ **StrategyDecisionService** - Strategy evaluation, signal generation, betting recommendations

**Key Test Scenarios:**
- Service initialization and dependency injection
- Data loading and error handling
- Business logic validation
- Mock data fallback mechanisms
- Configuration-driven behavior

### 2. Integration Tests (`integration/`)

Tests complete workflows and service interactions.

**Coverage:**
- ✅ **End-to-End Trading Pipeline** - Complete fixture → odds → strategy → betting → results flow
- ✅ **Trading Window Detection** - Real-time trading window identification
- ✅ **Strategy Evaluation Consistency** - Cross-service data validation
- ✅ **Error Handling and Resilience** - Graceful failure handling
- ✅ **Service Status and Health** - System monitoring capabilities

**Key Test Scenarios:**
- Complete automated trading cycle
- Data consistency across services
- Error recovery and fallback mechanisms
- Performance metric calculation
- System health monitoring

### 3. Angular Tests (`angular/`)

Tests frontend components and services.

**Coverage:**
- ✅ **FixturesComponent** - Fixture display, signal integration, real-time updates
- ✅ **ApiService** - HTTP requests, polling, error handling

**Key Test Scenarios:**
- Component initialization and data binding
- User interface state management
- API communication and error handling
- Real-time data updates
- Responsive design behavior

## Test Data and Mocking

### Mock Data Strategy
- **Consistent Mock Data**: All tests use standardized mock data for predictability
- **Realistic Scenarios**: Mock data represents real EPL matches and betting scenarios
- **Edge Case Coverage**: Tests include error conditions, empty data, and boundary conditions

### Key Mock Objects
```typescript
// Fixture Mock
const mockFixtures = [
  {
    homeTeam: 'Arsenal',
    awayTeam: 'Liverpool',
    kickoffTime: new Date('2025-07-04T15:00:00Z'),
    matchId: 'arsenal_v_liverpool_20250704',
    date: '2025-07-04',
    league: 'EPL',
    source: 'HKJC'
  }
];

// Odds Mock
const mockOddsData = {
  matches: [
    {
      homeTeam: 'Arsenal',
      awayTeam: 'Liverpool',
      odds: {
        homeWin: 2.40,
        draw: 3.30,
        awayWin: 2.90,
        asianHandicap: {
          homeHandicap: '-0.5',
          homeOdds: 1.85,
          awayHandicap: '+0.5',
          awayOdds: 1.95
        }
      }
    }
  ]
};

// Strategy Signals Mock
const mockSignals = [
  {
    homeTeam: 'Arsenal',
    awayTeam: 'Liverpool',
    strategy: 'Single_awayGoalDiff',
    expectedROI: 17.73,
    confidence: 0.85,
    betType: 'Asian Handicap',
    selection: 'Away +0.5'
  }
];
```

## Coverage Targets

The test suite maintains high coverage standards:

- **Branches**: 80%
- **Functions**: 80%  
- **Lines**: 80%
- **Statements**: 80%

## Test Environment Configuration

### Environment Variables
```bash
NODE_ENV=test                    # Test environment flag
ENABLE_LIVE_BETTING=false       # Disable live betting in tests
ENABLE_PAPER_TRADING=true       # Enable paper trading mode
BASE_STAKE=100                   # Test betting amounts
CONFIDENCE_THRESHOLD=0.6         # Strategy confidence threshold
```

### Dependencies
- **@nestjs/testing**: NestJS testing utilities
- **jest**: Test framework
- **ts-jest**: TypeScript support
- **@angular/testing**: Angular testing utilities
- **@angular/common/http/testing**: HTTP testing module

## Test Best Practices

### 1. Isolation
- Each test is independent and can run in isolation
- Proper setup and teardown in beforeEach/afterEach
- Mock external dependencies

### 2. Readability
- Descriptive test names following "should [expected behavior] when [condition]" pattern
- Clear arrange/act/assert structure
- Comprehensive error message validation

### 3. Coverage
- Test both success and error scenarios
- Validate edge cases and boundary conditions
- Test configuration-driven behavior

### 4. Performance
- Tests complete quickly (< 5 seconds for full suite)
- Parallel execution where possible
- Minimal external dependencies

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
```

## Debugging Tests

### Running Individual Tests
```bash
# Single test file with verbose output
npx jest src/v2/tests/unit/fixtures.service.test.ts --verbose

# Single test case
npx jest -t "should load fixtures from HKJC when browser is initialized"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues
1. **Mock Setup**: Ensure all dependencies are properly mocked
2. **Async Operations**: Use proper async/await or done callbacks
3. **Module Dependencies**: Check import paths and module resolution
4. **TypeScript Compilation**: Verify tsconfig.json settings

## Future Enhancements

### Planned Test Additions
- [ ] Performance/load testing for high-frequency trading
- [ ] End-to-end browser automation tests
- [ ] API contract testing
- [ ] Security testing for betting operations
- [ ] Chaos engineering for resilience testing

### Test Infrastructure Improvements
- [ ] Test data factories for complex scenarios
- [ ] Visual regression testing for dashboard components
- [ ] Test environment dockerization
- [ ] Automated test result reporting

## Contributing

When adding new features to the V2 system:

1. **Write tests first** (TDD approach)
2. **Maintain coverage** above 80% thresholds
3. **Update this documentation** with new test scenarios
4. **Run full test suite** before submitting changes

## Support

For test-related issues:
- Check the test output and error messages
- Review mock data and service configurations
- Verify environment variable settings
- Consult the NestJS and Angular testing documentation