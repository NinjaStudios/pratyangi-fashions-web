import { expect, test, type Page } from "@playwright/test";
import { scrollToY } from "./helpers";

// The hero stays pinned behind the page while Shop by Category slides up over it. As it is covered:
//  - the centre model fades out,
//  - the left models drift left and the right models drift right (outer ones further, so they never cross),
//  - the whole scene dims a little,
//  - the "Shop by Category" heading (no background) fades in, with a soft blur only while it overlaps the hero.
// Everything is driven by scroll position, so it must reverse exactly when scrolling back up.

const LEFT = ["left-1", "left-2", "left-3"];
const RIGHT = ["right-1", "right-2", "right-3"];

const heroBox = (page: Page) => page.locator("#top").boundingBox();
const categoryTop = (page: Page) => page.locator("#categories").evaluate((element) => Math.round(element.getBoundingClientRect().top));
const stageOpacity = (page: Page) => page.locator("#top > div").evaluate((element) => Number(getComputedStyle(element).opacity));
const stageFilter = (page: Page) => page.locator("#top > div").evaluate((element) => getComputedStyle(element).filter);
const sceneScale = (page: Page) => page.locator("#top > div > div").evaluate((element) => element.getBoundingClientRect().width / 1440);
const model = (page: Page, id: string) => page.locator(`[data-hero-model="${id}"]`);
const modelX = (page: Page, id: string) => model(page, id).evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
const modelOpacity = (page: Page, id: string) => model(page, id).evaluate((element) => Number(getComputedStyle(element).opacity));
const modelBox = (page: Page, id: string) => model(page, id).evaluate((element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right }; });
const headingOf = (page: Page) => page.locator("#categories h1").evaluateHandle((element) => element.parentElement as HTMLElement);
const headingOpacity = async (page: Page) => (await headingOf(page)).evaluate((element) => Number(getComputedStyle(element).opacity));
const headingFilter = async (page: Page) => (await headingOf(page)).evaluate((element) => getComputedStyle(element).filter);
const headingBackground = async (page: Page) => (await headingOf(page)).evaluate((element) => getComputedStyle(element).backgroundColor);

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

  test("all seven models stand in place at rest", async ({ page }) => {
    await page.goto("/");
    for (const id of [...LEFT, ...RIGHT, "center"]) {
      expect(await modelX(page, id), `${id} offset`).toBe(0);
      expect(await modelOpacity(page, id), `${id} opacity`).toBe(1);
    }
  });

  test("the centre model fades out gradually and returns when scrolling back", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;

    await scrollToY(page, hero.height * 0.35);
    await expect.poll(() => modelOpacity(page, "center")).toBeGreaterThan(0.05);
    expect(await modelOpacity(page, "center")).toBeLessThan(0.95);
    expect(await modelX(page, "center"), "the centre model never moves sideways").toBe(0);

    await scrollToY(page, hero.height * 0.9);
    await expect.poll(() => modelOpacity(page, "center")).toBeLessThan(0.05);

    await scrollToY(page, 0);
    await expect.poll(() => modelOpacity(page, "center")).toBe(1);
  });

  test("side models disperse outward, outer ones further, without crossing", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;
    const scale = await sceneScale(page);

    await scrollToY(page, hero.height * 0.5);
    await expect.poll(() => modelX(page, "left-1")).toBeLessThan(-20);
    const xs: Record<string, number> = {};
    for (const id of [...LEFT, ...RIGHT]) xs[id] = await modelX(page, id);
    for (const id of LEFT) expect(xs[id], `${id} moves left`).toBeLessThan(0);
    for (const id of RIGHT) expect(xs[id], `${id} moves right`).toBeGreaterThan(0);
    expect(Math.abs(xs["left-3"])).toBeGreaterThan(Math.abs(xs["left-2"]));
    expect(Math.abs(xs["left-2"])).toBeGreaterThan(Math.abs(xs["left-1"]));
    expect(Math.abs(xs["right-3"])).toBeGreaterThan(Math.abs(xs["right-2"]));
    expect(Math.abs(xs["right-2"])).toBeGreaterThan(Math.abs(xs["right-1"]));

    // neighbours stay apart: each model's edge never passes the next one in
    const l1 = await modelBox(page, "left-1"), l2 = await modelBox(page, "left-2");
    const r1 = await modelBox(page, "right-1"), r2 = await modelBox(page, "right-2");
    expect(l2.right).toBeLessThanOrEqual(l1.left);
    expect(r1.right).toBeLessThanOrEqual(r2.left);

    // end of the transition: they have travelled the designed distance
    await scrollToY(page, hero.height * 1.2);
    await expect.poll(() => modelX(page, "left-1")).toBeCloseTo(-288 * scale, 0);
    await expect.poll(() => modelX(page, "right-1")).toBeCloseTo(288 * scale, 0);

    // and they come back
    await scrollToY(page, 0);
    for (const id of [...LEFT, ...RIGHT]) await expect.poll(() => modelX(page, id)).toBe(0);
  });

  test("the heading has no background and appears only when scrolling", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;

    expect(await headingBackground(page), "no background colour").toBe("rgba(0, 0, 0, 0)");
    expect(await headingOpacity(page)).toBeLessThan(0.05);

    await scrollToY(page, hero.height * 0.6);
    await expect.poll(() => headingOpacity(page)).toBe(1);
    expect(await headingBackground(page)).toBe("rgba(0, 0, 0, 0)");

    await scrollToY(page, 0);
    await expect.poll(() => headingOpacity(page)).toBeLessThan(0.05);
  });

  test("the heading blurs only while it overlaps the hero, and ends sharp", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;

    expect(await headingFilter(page)).toBe("none");

    await scrollToY(page, hero.height * 0.4);
    await expect.poll(() => headingFilter(page)).toMatch(/blur\(/);

    await scrollToY(page, hero.height * 1.1);
    await expect.poll(() => headingFilter(page)).toBe("none");

    await scrollToY(page, 0);
    await expect.poll(() => headingFilter(page)).toBe("none");
  });

  test("the hero scene is never blurred and dims only a little", async ({ page }) => {
    await page.goto("/");
    const hero = (await heroBox(page))!;
    expect(await stageOpacity(page)).toBe(1);
    for (const factor of [0.2, 0.5, 0.8, 1.2]) {
      await scrollToY(page, hero.height * factor);
      await page.waitForTimeout(250);
      expect(await stageFilter(page), `hero at ${factor}`).toBe("none");
    }
    await expect.poll(() => stageOpacity(page)).toBeCloseTo(0.6, 1);
    await scrollToY(page, 0);
    await expect.poll(() => stageOpacity(page)).toBe(1);
  });

  for (const width of [320, 375, 425]) {
    test(`no sideways scrolling at ${width}px wide while the transition plays`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const hero = (await heroBox(page))!;
      for (const factor of [0, 0.3, 0.6, 1, 1.5]) {
        await scrollToY(page, hero.height * factor);
        await page.waitForTimeout(150);
        const wider = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(wider, `page wider than the screen at scroll factor ${factor}`).toBe(false);
      }
    });
  }

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("nothing moves, fades or blurs, and the heading is always visible", async ({ page }) => {
      await page.goto("/");
      const hero = (await heroBox(page))!;
      expect(await headingOpacity(page)).toBe(1);
      for (const factor of [0.5, 1.2]) {
        await scrollToY(page, hero.height * factor);
        await page.waitForTimeout(300);
        expect(await stageOpacity(page)).toBe(1);
        expect(await stageFilter(page)).toBe("none");
        expect(await headingFilter(page)).toBe("none");
        for (const id of [...LEFT, ...RIGHT, "center"]) {
          expect(await modelX(page, id), `${id} offset`).toBe(0);
          expect(await modelOpacity(page, id), `${id} opacity`).toBe(1);
        }
      }
    });
  });
});

test("each side model carries its gold stand away with it", async ({ page }) => {
  await page.goto("/");
  const stand = (id: string) => page.locator(`[data-hero-model="${id}"] [class*=plinth]`);
  const left = async (locator: ReturnType<typeof stand>) => (await locator.boundingBox())!.x;
  const hero = (await heroBox(page))!;

  for (const id of [...LEFT, ...RIGHT]) {
    await scrollToY(page, 0);
    const standAtRest = await left(stand(id));
    const modelAtRest = await modelBox(page, id);
    await scrollToY(page, hero.height * 0.8);
    await expect.poll(async () => Math.abs((await left(stand(id))) - standAtRest)).toBeGreaterThan(40);
    const standMoved = (await left(stand(id))) - standAtRest;
    const modelMoved = (await modelBox(page, id)).left - modelAtRest.left;
    expect(Math.abs(standMoved - modelMoved), `${id}: stand and model move together`).toBeLessThan(1);
    expect(Math.sign(standMoved)).toBe(LEFT.includes(id) ? -1 : 1);
  }
});
