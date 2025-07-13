#!/bin/bash

# V2 System Test Runner
echo "🧪 Running V2 System Tests"
echo "=========================="

# Set test environment
export NODE_ENV=test

# Run unit tests
echo "📋 Running Unit Tests..."
npx jest --config=src/v2/tests/jest.config.js --testPathPattern="unit"

# Run integration tests
echo "🔗 Running Integration Tests..."
npx jest --config=src/v2/tests/jest.config.js --testPathPattern="integration"

# Run Angular component tests
echo "🅰️ Running Angular Component Tests..."
npx jest --config=src/v2/tests/jest.config.js --testPathPattern="angular"

# Generate coverage report
echo "📊 Generating Coverage Report..."
npx jest --config=src/v2/tests/jest.config.js --coverage

echo "✅ All tests completed!"
echo "📁 Coverage report available in coverage/ directory"