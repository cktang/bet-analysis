import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Suppress console.log during tests unless NODE_ENV=test-verbose
  if (process.env.NODE_ENV !== 'test-verbose') {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});