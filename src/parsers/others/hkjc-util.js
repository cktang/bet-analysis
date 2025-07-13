const TIMEOUT = 2000;

const hkjc_login = async (page, credentials = null) => {
  console.warn("Logging in");
  
  // Use provided credentials or fall back to hardcoded defaults
  const username = credentials?.username || "04098071";
  const password = credentials?.password || "1glorybox";
  const answersMap = credentials?.answers || {
    "你出生的醫院名稱是甚麼?": "queene",
    "你最喜愛的食物?": "eggs",
    "你第一份工作的地點?": "metro",
    "你最喜愛的女藝人?": "kaytse",
    "你的駕駛執照有效期至?": "2022",
  };
  
  await page.goto("https://bet.hkjc.com/en/football/home");
  await page.getByPlaceholder("Login name / Betting Account").click();
  await page.locator("#login-account-input").fill(username);
  await page.waitForTimeout(TIMEOUT);
  await page.locator("#login-account-input").press("Tab");
  await page.locator("#login-password-input").fill(password);
  await page.waitForTimeout(TIMEOUT);
  await page.getByText("Login").first().click();
  await page.waitForTimeout(TIMEOUT);

  let question = null;
  if (await page.locator(".login-question").count() > 0) {
    question = await page.locator(".login-question").textContent();
  }
  
  if (question) {
    const answer = answersMap[question.trim()];
    console.warn("Answering question", question);
  
    await page.locator('#betslip-panel').getByRole('textbox').fill(answer);
    await page.waitForTimeout(TIMEOUT);
    await page.getByText("Confirm", { exact: true }).click();
    await page.waitForTimeout(TIMEOUT);
  }
  await page.getByText("Proceed").click();
  await page.waitForTimeout(TIMEOUT);

  // Wait for logout button to appear (indicates successful login)
  await page.getByText("Logout").waitFor({ timeout: 10000 });
  
  // Additional wait to ensure session is fully established
  await page.waitForTimeout(TIMEOUT * 2);
  console.warn("Logged in");
};

const hkjc_logout = async (page) => {
    console.warn('Logging out');
    await page.waitForTimeout(TIMEOUT);
    await page.getByText("Logout").click();
    await page.waitForTimeout(TIMEOUT);
    await page.getByTestId("overlay").getByText("OK").click();
    await page.waitForTimeout(TIMEOUT);
    await page.getByText("Close").click();
    console.warn('Logged out');
};

const hkjc_bet_handicap = async (page, match, amount = 200, bettingUrl = null) => {
    console.warn("Placing bet", match.id, match.decision, amount);
    
    // Navigate to betting page using click navigation instead of direct goto
    console.warn(`Navigating to Asian Handicap page via clicks...`);
    
    try {
        // Look for Asian Handicap or HDC link on current page
        const hdcLink = page.locator('#hdc');
        const hdcLinkCount = await hdcLink.count();
        
        if (hdcLinkCount > 0) {
            console.warn("Found HDC link, clicking to navigate...");
            await hdcLink.first().click();
            await page.waitForTimeout(TIMEOUT);
        } else {
            // Fallback: try to navigate via menu or direct goto as last resort
            console.warn("No HDC link found, trying direct navigation...");
            await page.goto(bettingUrl);
            await page.waitForTimeout(TIMEOUT);
        }
        
        // Verify we're still logged in after navigation
        await page.getByText("Logout").waitFor({ timeout: 5000 });
        console.warn("✅ Still logged in after navigation to HDC page");
        
    } catch (error) {
        console.error("❌ Navigation or login verification failed:", error.message);
        return false;
    }
    
    const index = match.decision === "home" ? 0 : 1;
    await page.locator(`#HDC_${match.id} input[type=checkbox]`).nth(index).click();
    await page.waitForTimeout(TIMEOUT);
    await page.getByText("Add").first().click();
    await page.waitForTimeout(TIMEOUT);
    await page.getByRole("textbox").dblclick();
    await page.waitForTimeout(TIMEOUT);
    await page.getByRole("textbox").fill(String(amount));

    await page.waitForTimeout(TIMEOUT);
    await page.getByRole("button", { name: "Place Bet" }).click();
    await page.waitForTimeout(TIMEOUT);
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.waitForTimeout(TIMEOUT);

    await page.getByText("Done");
    await page.getByRole("button", { name: "Done" }).click();

    return true;
}

module.exports = { 
    hkjc_login,
    hkjc_logout,
    hkjc_bet_handicap
};