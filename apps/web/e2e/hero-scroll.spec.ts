import { expect, test, type Page } from "@playwright/test";
import { scrollToY } from "./helpers";

// The hero stays pinned behind the page while Shop by Category slides up over it. As it is covered the hero dims.
// The "Shop by Category" heading is hidden at rest and appears only as the page is scrolled. There is no blur anywhere.
// Everything is driven by scroll position, so it must reverse exactly when scrolling back up.

const heroBox = (page: Page) => page.locator("#top").boundingBox();
const categoryTop = (page: Page) => page.locator("#categories").evaluate((element) => Math.round(element.getBoundingClientRect().top));
const stageOpacity = (page: Page) => page.locator("#top > div").evaluate((element) => Number(getComputedStyle(element).opacity));
const stageFilter = (page: Page) => page.locator("#top > div").evaluate((element) => getComputedStyle(element).filter);
const headingOf = (page: Page) => page.locator("#categories h1").evaluateHandle((element) => element.parentElement as HTMLElement);
const headingOpacity = async (page: Page) => (await headingOf(page)).evaluate((element) => Number(getComputedStyle(element).opacity));
const headingFilter = async (page: Page) => (await headingOf(page)).evaluate((element) => getComputedStyle(element).filter);

test.describe("hero and Shop by Category layering", () => {
  test("hero stays pinned while the category section rises over it", async ({ page }) => {
    await page.goto("/");
    const hero = await heroBox(page);
    if (!hero) throw new Error("hero not found");
    const startTop = Math.round(hero.y);
    const startCategory = await categoryTop(page);

    await scrollToY(page, hero.height * 0.5);
    await expect.poll(() => categoryTop(page)).toBeLessThan(startCategory - hero.height * 0.4);
    expect(Math.round((await heroBox(page))!.y)).toBe(startTop);

    // fully covered: the category section has reached the pinned hero's top edge
    await scrollToY(page, hero.height);
    await expect.poll(() => categoryTop(page)).toBeLessThanOrEqual(startTop + 2);
    expect(Math.round((await heroBox(page))!.y)).toBe(startTop);
  });

  test("category cards sit directly under the hero at rest, with no gap", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;
    const firstCard = await page.getByLabel("Categories, horizontally scrollable").locator("a").first().boundingBox();
    expect(Math.abs(firstCard!.y - (hero.y + hero.height))).toBeLessThanOrEqual(2);
  });

  test("the heading appears only when scrolling, and hides again at the top", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;

    expect(await headingOpacity(page)).toBeLessThan(0.05);

    await scrollToY(page, hero.height * 0.6);
    await expect.poll(() => headingOpacity(page)).toBe(1);

    await scrollToY(page, 0);
    await expect.poll(() => headingOpacity(page)).toBeLessThan(0.05);
  });

  test("nothing is blurred at any scroll position", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;
    for (const factor of [0, 0.2, 0.5, 0.8, 1.2]) {
      await scrollToY(page, hero.height * factor);
      await page.waitForTimeout(250);
      expect(await stageFilter(page), `hero at ${factor}`).toBe("none");
      expect(await headingFilter(page), `heading at ${factor}`).toBe("none");
    }
  });

  test("the hero dims as it is covered and recovers when scrolling back up", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;

    expect(await stageOpacity(page)).toBe(1);
    await scrollToY(page, hero.height * 1.2);
    await expect.poll(() => stageOpacity(page)).toBeCloseTo(0.6, 1);
    await scrollToY(page, 0);
    await expect.poll(() => stageOpacity(page)).toBe(1);
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("no dimming, and the heading is always visible", async ({ page }) => {
      await page.goto("/");
      const hero = (await heroBox(page))!;
      expect(await headingOpacity(page)).toBe(1);
      for (const factor of [0.5, 1.2]) {
        await scrollToY(page, hero.height * factor);
        await page.waitForTimeout(300);
        expect(await stageOpacity(page)).toBe(1);
        expect(await stageFilter(page)).toBe("none");
      }
    });
  });
});
