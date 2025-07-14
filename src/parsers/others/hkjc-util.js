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


  // "more ways to verify" might not appear, so wait for a while to see if it shows up and click if present
  // Find the div with the exact text inside the OTP popup container

  // Wait for it to be visible and click it
  // Wait up to 5s for .otp-popup-container to appear
  const otpPopupAppeared = await page.locator('.otp-popup-container').waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
  if (otpPopupAppeared) {
    console.warn('found login captcha popup');
    const moreWaysDiv = await page.locator('.otp-popup-container >> text="More ways to verify"').first();
    await moreWaysDiv.click();

    const iWantToUseAnswerDiv = await page.locator('.otp-trouble >> text="I want to use login answer to login"').first();
    await iWantToUseAnswerDiv.click();
    await page.waitForTimeout(TIMEOUT);

    // Use a different variable name to avoid redeclaration
    const loginQuestion = await page.locator(".ekbapopup-container .ekbapopup-login-question").textContent();
    const answer = answersMap[(loginQuestion + "").trim() ?? ""];
    console.warn({loginQuestion, answer});

    // Find the input inside the .ekbapopup-answer-input container and fill it (case sensitive)
    const answerInput = await page.locator('.ekbapopup-answer-input input').first();
    await answerInput.fill(answer);

    // Click the "Next" button with exact case-sensitive match, but only inside the .ekbapopup-container
    await page.locator('.ekbapopup-container').getByText("Next", { exact: true }).click();

    // Click the div with the exact case-sensitive text "Trust this browser" (multi-line allowed)
    // This is part of the text only, so we still match the container by partial text
    await page.waitForTimeout(TIMEOUT);
    // Find the first div that has the exact text "Trust this browser" and click it
    await page.locator('div', { hasText: "Trust this browser" }).nth(1).click();

    // Click the "Next" button again, but only inside the same div.trustbrowser-container2
    await page.locator('div.trustbrowser-container').getByText("Next", { exact: true }).click();
  } else {
    console.warn('"login popup" not found or not visible');
  }


  // let question = null;
  // if (await page.locator(".login-question").count() > 0) {
  //   question = await page.locator(".login-question").textContent();
  // }

  // if (question) {
  //   const answer = answersMap[question.trim()];
  //   console.warn("Answering question", question);
  
  //   await page.locator('#betslip-panel').getByRole('textbox').fill(answer);
  //   await page.waitForTimeout(TIMEOUT);
  //   await page.getByText("Confirm", { exact: true }).click();
  //   await page.waitForTimeout(TIMEOUT);
  // }
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