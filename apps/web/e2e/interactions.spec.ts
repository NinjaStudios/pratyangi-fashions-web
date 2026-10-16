import { expect, test } from "@playwright/test";

test.describe("header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Shop menu opens and closes with Esc", async ({ page }) => {
    const menu = page.getByRole("navigation", { name: "Shop sections" });
    await page.locator("header").getByRole("button", { expanded: false }).first().click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("search dialog is keyboard accessible", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: "Search catalog" });
    const dialog = page.getByRole("dialog", { name: "Search catalog" });

    await searchButton.click();
    await expect(dialog).toBeVisible();
    await expect(page.locator("#catalog-search")).toBeFocused();

    // Tab and Shift+Tab never leave the dialog
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")))).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(searchButton).toBeFocused();
  });
});

test("add to cart increases the bag count", async ({ page }) => {
  await page.goto("/");
  const bagLink = page.getByRole("link", { name: /Open your bag/ });
  const countOf = async () => Number(((await bagLink.getAttribute("aria-label")) ?? "").match(/(\d+) items?/)?.[1]);

  // The bag loads from browser storage after the page appears, so wait for the real starting count (not the empty 0)
  await expect.poll(countOf).toBeGreaterThan(0);
  const before = await countOf();

  // The button is revealed on hover on desktop, so click it directly
  await page.getByRole("button", { name: /to cart/i }).first().click({ force: true });
  await expect.poll(countOf).toBe(before + 1);
});

test("category carousel moves with the arrows and stops cleanly at both ends", async ({ page }) => {
  await page.goto("/");
  const track = page.getByLabel("Categories, horizontally scrollable");
  const next = page.getByRole("button", { name: "Scroll categories right" });
  const previous = page.getByRole("button", { name: "Scroll categories left" });
  const scrollLeft = () => track.evaluate((element) => Math.round(element.scrollLeft));

  await track.scrollIntoViewIfNeeded();
  await expect(previous).toBeDisabled();
  expect(await scrollLeft()).toBe(0);

  await next.click();
  await expect.poll(scrollLeft).toBeGreaterThan(0);

  // Walk to the end: the right arrow disables, and the last card ends flush with the track (no blank space)
  for (let i = 0; i < 20 && (await next.isEnabled()); i++) {
    await next.click();
    await page.waitForTimeout(450);
  }
  await expect(next).toBeDisabled();
  const blankAfterLast = await track.evaluate((element) => {
    const cards = element.querySelectorAll("a");
    return Math.round(element.getBoundingClientRect().right - cards[cards.length - 1].getBoundingClientRect().right);
  });
  expect(Math.abs(blankAfterLast)).toBeLessThanOrEqual(2);

  // And all the way back
  for (let i = 0; i < 20 && (await previous.isEnabled()); i++) {
    await previous.click();
    await page.waitForTimeout(450);
  }
  await expect(previous).toBeDisabled();
  expect(await scrollLeft()).toBe(0);
});
