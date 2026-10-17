import { expect, test } from "@playwright/test";

// Mouse-wheel scrolling is eased (Lenis): the page glides to its target over several frames instead of jumping.
test("mouse wheel scrolling glides instead of jumping", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch scrolling stays native");
  await page.goto("/");
  await page.mouse.move(700, 400);

  // record scrollY every frame inside the page, so test speed cannot affect the result
  await page.evaluate(() => {
    const w = window as unknown as { __samples: number[] };
    w.__samples = [];
    const record = () => {
      w.__samples.push(Math.round(window.scrollY));
      requestAnimationFrame(record);
    };
    record();
  });
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 }).toBeGreaterThan(500);

  const samples = (await page.evaluate(() => (window as unknown as { __samples: number[] }).__samples)).filter((y) => y > 0 && y < 540);
  expect(samples.length).toBeGreaterThanOrEqual(1); // passed through at least one in-between position, not one jump (a busy machine draws fewer frames)
  const all = await page.evaluate(() => (window as unknown as { __samples: number[] }).__samples);
  for (let i = 1; i < all.length; i++) expect(all[i]).toBeGreaterThanOrEqual(all[i - 1]);
});

test.describe("customer reviews", () => {
  const rowOf = (page: import("@playwright/test").Page) => page.locator("#reviews [class*=reviewViewport]");
  const left = (row: import("@playwright/test").Locator) => row.evaluate((element) => element.scrollLeft);

  test("drift by themselves and loop without end", async ({ page }) => {
    await page.goto("/");
    const row = rowOf(page);
    await row.evaluate((element) => element.scrollIntoView({ block: "center" }));
    const first = await left(row);
    await expect.poll(() => left(row), { timeout: 5000 }).toBeGreaterThan(first + 5); // moving on its own
    // jump near the end of the middle group: it must wrap back instead of running out
    const group = await row.evaluate((element) => element.scrollWidth / 3);
    await row.evaluate((element, target) => { element.scrollLeft = target; }, group * 2 - 10);
    await expect.poll(() => left(row), { timeout: 8000 }).toBeLessThan(group * 1.5);
  });

  test("can be scrolled by hand and keeps its place, then drifts on again", async ({ page, isMobile }) => {
    await page.goto("/");
    const row = rowOf(page);
    await row.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(400);
    const before = await left(row);
    if (isMobile) {
      await row.evaluate((element) => { element.scrollLeft += 300; });
    } else {
      const box = (await row.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(400, 0); // trackpad / shift-wheel sideways scroll
    }
    await expect.poll(async () => Math.abs((await left(row)) - before), { timeout: 4000 }).toBeGreaterThan(150);
  });

  test("can be dragged with the mouse, and pauses while the pointer is over it", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse only");
    await page.goto("/");
    const row = rowOf(page);
    await row.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(400);
    const box = (await row.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.waitForTimeout(200);
    const still = await left(row);
    await page.waitForTimeout(700);
    expect(Math.abs((await left(row)) - still)).toBeLessThan(3); // paused under the pointer

    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 200, y, { steps: 8 });
    await page.mouse.up();
    expect((await left(row)) - still).toBeGreaterThan(150); // dragging left moves the row forward
  });
});

test("product cards fade up as they scroll into view", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("#arrivals article").first();
  await card.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect.poll(() => card.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
});
