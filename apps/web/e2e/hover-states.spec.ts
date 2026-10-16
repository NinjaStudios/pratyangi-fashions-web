import { expect, test } from "@playwright/test";

// Hover effects only exist for a mouse, so these run on the desktop project.
test.skip(({ isMobile }) => isMobile, "no hover on touch screens");

const scaleX = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element, "::after").transform).a);

test.describe("hover states", () => {
  test("Shop menu titles draw a line in on hover and out again, and links stay lined up with them", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("button", { name: /Shop/ }).click();
    const menu = page.getByRole("navigation", { name: "Shop sections" });
    const women = menu.getByRole("heading", { name: "WOMEN" });
    await expect(women).toBeVisible();
    await page.waitForTimeout(700);

    expect(await scaleX(women)).toBe(0);
    await women.hover();
    await expect.poll(() => scaleX(women)).toBeGreaterThan(0.99);
    await page.mouse.move(700, 700);
    await expect.poll(() => scaleX(women)).toBeLessThan(0.01);

    // the links stay lined up with their title until one is hovered
    const titleLeft = (await women.boundingBox())!.x;
    const linkLeft = (await menu.getByRole("link", { name: "Half Sarees" }).boundingBox())!.x;
    expect(Math.abs(linkLeft - titleLeft)).toBeLessThanOrEqual(1);
  });

  test("menu links shift and change colour on hover", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("button", { name: /Shop/ }).click();
    const link = page.getByRole("navigation", { name: "Shop sections" }).getByRole("link", { name: "Uppada" });
    await page.waitForTimeout(700);
    const before = await link.boundingBox();
    const colourBefore = await link.evaluate((element) => getComputedStyle(element).color);
    await link.hover();
    await expect.poll(async () => (await link.boundingBox())!.x).toBeGreaterThan(before!.x + 8);
    expect(await link.evaluate((element) => getComputedStyle(element).color)).not.toBe(colourBefore);
  });

  test("a product card lifts on hover", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#arrivals article").first();
    await card.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect.poll(() => card.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
    await page.waitForTimeout(500);
    const before = (await card.boundingBox())!.y;
    await card.hover();
    await expect.poll(async () => (await card.boundingBox())!.y).toBeLessThan(before - 2);
  });

  test("category cards, offers and the header search react to hover", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("button", { name: "Search catalog" });
    const bg = await search.evaluate((element) => getComputedStyle(element).backgroundColor);
    await search.hover();
    await expect.poll(() => search.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(bg);

    const offer = page.locator("[class*=offerCard]").first();
    await offer.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(800);
    const offerY = (await offer.boundingBox())!.y;
    await offer.hover();
    await expect.poll(async () => (await offer.boundingBox())!.y).toBeLessThan(offerY - 1);
  });

  test("section headings ease in when scrolled to", async ({ page }) => {
    await page.goto("/");
    for (const name of ["New Arrivals", "Wedding Collection", "Festive Collections", "Best Sellers", "Loved by our Customers"]) {
      const heading = page.getByRole("heading", { name, exact: true });
      await heading.evaluate((element) => element.scrollIntoView({ block: "center" }));
      await expect.poll(() => heading.evaluate((element) => Number(getComputedStyle(element).opacity)), { message: name }).toBe(1);
      expect(await heading.evaluate((element) => getComputedStyle(element).filter), name).toMatch(/^(none|blur\(0(px)?\))$/);
    }
  });
});
