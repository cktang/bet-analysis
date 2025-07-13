const hkjc_login = async (page) => {
  console.warn("Logging in");

  await page.goto("https://bet.hkjc.com/en/football/home");
  await page.getByPlaceholder("Login name / Betting Account").click();
  await page.locator("#login-account-input").fill("04098071");
  await page.waitForTimeout(1000);
  await page.locator("#login-account-input").press("Tab");
  await page.locator("#login-password-input").fill("1glorybox");
  await page.waitForTimeout(1000);
  await page.getByText("Login").first().click();

  const betslipPanel = await page.locator("#betslip-panel");

  const answersMap = {
    "你出生的醫院名稱是甚麼?": "queene",
    "你最喜愛的食物?": "eggs",
    "你第一份工作的地點?": "metro",
    "你最喜愛的女藝人?": "kaytse",
    "你的駕駛執照有效期至?": "2022",
  };

  const question = await page.locator(".login-question").textContent();
  await betslipPanel.getByRole("textbox").fill(answersMap[question ?? ""]);

  await page.waitForTimeout(1000);
  await page.getByText("Confirm", { exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByText("Proceed").click();
  await page.waitForTimeout(1000);

  await page.getByText("Logout");
  console.warn("Logged in");
};

const hkjc_logout = async (page) => {
    await page.waitForTimeout(1000);
    await page.getByText("Logout").click();
    await page.waitForTimeout(1000);
    await page.getByTestId("overlay").getByText("OK").click();
    await page.waitForTimeout(1000);
    await page.getByText("Close").click();
};

const hkjc_bet_handicap = async (page, match, amount = 10) => {
    const element = match.element;
    if (match.decision === "home") {
        await element.locator("input[type='checkbox']").first().check();
    } else {
        await element.locator("input[type='checkbox']").nth(1).check();
    }

    await page.getByText("Add").first().click();
    await page.waitForTimeout(1000);
    await page.getByRole("textbox").dblclick();
    await page.waitForTimeout(1000);
    await page.getByRole("textbox").fill(amount);

    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Place Bet" }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.waitForTimeout(1000);

    await page.getByText("Done");
    await page.getByRole("button", { name: "Done" }).click();
}

module.exports = { 
    hkjc_login,
    hkjc_logout,
    hkjc_bet_handicap
};