import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    permissions: ["geolocation"],
    geolocation: {
      latitude: 22.320390266127735,
      longitude: 114.15877994838783,
    },
    extraHTTPHeaders: {
      Cookie:
        "_ga_3SDQH84JFQ=GS1.1.1740799496.8.1.1740799866.0.0.0; _ga=GA1.1.1703857181.1740146672; _accepted_announcement=1; PHPSESSID=k14uns2amrmq04he5kacugh0q3; TS014be60b=01b05fe21d7dd541cd86e367802fb8f6b300702832526e6081c068a733ce7160ec0f03db6130fc955e6e5790e5cf3df29eb46e81bb4428216c6e1728e6df12b868dc369b143ee945c3da77f99d3033864684f97530; back_link=; _read_guide=1; prev_detect=1740799866836; global_current_lat=22.320390266127735; global_current_lng=114.15877994838783; gps=1; target_lat=22.320451; target_lng=114.159082; _gid=GA1.3.1251271120.1740799497; _gat_gtag_UA_200263427_1=1",
    },
  },

  timeout: 36000000,
  
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
