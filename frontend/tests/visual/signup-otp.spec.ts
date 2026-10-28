import { expect, test, type Page } from "@playwright/test";

async function openVerificationStep(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("techit_cookie_consent", "essential-only");
  });
  await page.route("**/auth/send-otp", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Verification code sent", expiresIn: 600 }),
    });
  });

  await page.goto("/signup");
  await page.getByPlaceholder("First Name").fill("Eli");
  await page.getByPlaceholder("Last Name").fill("Explorer");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Email Address").fill("eli@example.com");
  await page.getByRole("button", { name: "Send Verification Code" }).click();
  await expect(page.getByText("Step 03")).toBeVisible();

  return {
    input: page.locator("[data-input-otp]"),
    slots: page.locator('[data-slot="input-otp-slot"]'),
  };
}

test.describe("signup verification code", () => {
  test("accepts sequential typing, backspace, and submits the typed code", async ({ page }) => {
    let submittedCode = "";
    await page.route("**/auth/verify-otp", async (route) => {
      submittedCode = (await route.request().postDataJSON()).code;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: true, verificationToken: "verified-token" }),
      });
    });
    const { input, slots } = await openVerificationStep(page);

    await input.pressSequentially("123456");
    await expect(input).toHaveValue("123456");
    await expect(slots).toHaveText(["1", "2", "3", "4", "5", "6"]);

    await input.press("Backspace");
    await expect(input).toHaveValue("12345");
    await expect(slots).toHaveText(["1", "2", "3", "4", "5", ""]);

    await input.press("6");
    await page.getByRole("button", { name: "Verify Code" }).click();
    await expect.poll(() => submittedCode).toBe("123456");
  });

  test("sanitizes a pasted verification code", async ({ page }) => {
    const { input, slots } = await openVerificationStep(page);

    await input.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", "65 43-21");
      element.dispatchEvent(new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }));
    });

    await expect(input).toHaveValue("654321");
    await expect(slots).toHaveText(["6", "5", "4", "3", "2", "1"]);
  });

  test("supports the mobile one-time-code autofill contract", async ({ page }) => {
    const { input, slots } = await openVerificationStep(page);

    await expect(input).toHaveAttribute("autocomplete", "one-time-code");
    await expect(input).toHaveAttribute("inputmode", "numeric");
    await input.fill("112233");

    await expect(input).toHaveValue("112233");
    await expect(slots).toHaveText(["1", "1", "2", "2", "3", "3"]);
  });
});
