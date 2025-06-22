const TIMEOUT = 2000;

const hkjc_login = async (page) => {
  console.warn("Logging in");
//   await page.goto("https://bet.hkjc.com/en/football/home");
  await page.getByPlaceholder("Login name / Betting Account").click();
  await page.locator("#login-account-input").fill("04098071");
  await page.waitForTimeout(TIMEOUT);
  await page.locator("#login-account-input").press("Tab");
  await page.locator("#login-password-input").fill("1glorybox");
  await page.waitForTimeout(TIMEOUT);
  await page.getByText("Login").first().click();
  await page.waitForTimeout(TIMEOUT);

  const answersMap = {
    "你出生的醫院名稱是甚麼?": "queene",
    "你最喜愛的食物?": "eggs",
    "你第一份工作的地點?": "metro",
    "你最喜愛的女藝人?": "kaytse",
    "你的駕駛執照有效期至?": "2022",
  };

  const question = await page.locator(".login-question").textContent();
  const answer = answersMap[question.trim()];
  console.warn("Answering question", question);

  await page.locator('#betslip-panel').getByRole('textbox').fill(answer);
  await page.waitForTimeout(TIMEOUT);
  await page.getByText("Confirm", { exact: true }).click();
  await page.waitForTimeout(TIMEOUT);
  await page.getByText("Proceed").click();
  await page.waitForTimeout(TIMEOUT);

  await page.getByText("Logout");
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

const hkjc_bet_handicap = async (page, match, amount = 200) => {
    console.warn("Placing bet", match.id, match.decision, amount);
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
}

module.exports = { 
    hkjc_login,
    hkjc_logout,
    hkjc_bet_handicap
};