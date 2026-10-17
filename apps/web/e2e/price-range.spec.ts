import { expect, test } from "@playwright/test";

test.describe("price range slider", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    await page.goto("/new-arrivals");
    if (isMobile) await page.getByRole("button", { name: /Filters/ }).click();
  });

  test("shows the full range with two handles, and reset is off until something changes", async ({ page }) => {
    await expect(page.getByRole("slider", { name: "Minimum price" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Maximum price" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset price range" })).toBeDisabled();
  });

  test("the handles move with the keyboard, narrow the products, and reset brings everything back", async ({ page }) => {
    const count = page.getByText(/^\d+ Products?$/);
    const all = await count.innerText();
    const high = page.getByRole("slider", { name: "Maximum price" });
    await high.focus();
    await high.press("Home");
    // the top handle stops one step above the bottom one instead of crossing it
    const bottom = Number(await page.getByRole("slider", { name: "Minimum price" }).inputValue());
    await expect(high).toHaveValue(String(bottom + 500));
    await expect(count).not.toHaveText(all);

    await page.getByRole("button", { name: "Reset price range" }).click();
    await expect(count).toHaveText(all);
    await expect(page.getByRole("button", { name: "Reset price range" })).toBeDisabled();
  });

  test("the handles can never cross, and a quick range sets both", async ({ page }) => {
    const low = page.getByRole("slider", { name: "Minimum price" });
    const high = page.getByRole("slider", { name: "Maximum price" });
    await low.focus();
    await low.press("End");
    expect(Number(await low.inputValue())).toBeLessThan(Number(await high.inputValue()));

    await page.getByRole("button", { name: "₹10,000 – ₹25,000" }).click();
    await expect(page.getByText("₹10,000 – ₹25,000", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "₹10,000 – ₹25,000" })).toHaveAttribute("aria-pressed", "true");
    await expect(low).toHaveValue("10000");
    await expect(high).toHaveValue("25000");
  });
});
