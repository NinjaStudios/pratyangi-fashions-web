import { expect, test, type Page } from "@playwright/test";
import { scrollToY } from "./helpers";

// The hero stays pinned behind the page while Shop by Category slides up over it. As it is covered the hero
// blurs and dims, and the heading is only softened mid-transition. Everything is driven by scroll position,
// so it must reverse exactly when scrolling back up.

const heroBox = (page: Page) => page.locator("#top").boundingBox();
const categoryTop = (page: Page) => page.locator("#categories").evaluate((element) => Math.round(element.getBoundingClientRect().top));
const stageFilter = (page: Page) => page.locator("#top > div").evaluate((element) => getComputedStyle(element).filter);
const headingFilter = (page: Page) => page.locator("#categories h1").evaluate((element) => getComputedStyle(element.parentElement as HTMLElement).filter);

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

  test("blur is tied to scroll and reverses when scrolling back up", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;

    // at rest: sharp
    expect(await stageFilter(page)).toBe("none");
    expect(await headingFilter(page)).toBe("none");

    // mid-transition: hero blurred, heading softened
    await scrollToY(page, hero.height * 0.5);
    await expect.poll(() => stageFilter(page)).toMatch(/blur\(/);
    await expect.poll(() => headingFilter(page)).toMatch(/blur\(/);

    // fully covered: hero at maximum blur, heading sharp again (never permanently blurred)
    await scrollToY(page, hero.height * 1.2);
    await expect.poll(() => stageFilter(page)).toBe("blur(4px)");
    await expect.poll(() => headingFilter(page)).toBe("none");

    // back to the top: everything sharp again
    await scrollToY(page, 0);
    await expect.poll(() => stageFilter(page)).toBe("none");
    await expect.poll(() => headingFilter(page)).toBe("none");
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("no blur or dimming is applied", async ({ page }) => {
      await page.goto("/");
      const hero = (await heroBox(page))!;
      for (const factor of [0.5, 1.2]) {
        await scrollToY(page, hero.height * factor);
        await page.waitForTimeout(300);
        expect(await stageFilter(page)).toBe("none");
        expect(await headingFilter(page)).toBe("none");
      }
    });
  });
});
