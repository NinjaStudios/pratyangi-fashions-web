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

test("customer reviews scroll by themselves, endlessly, and pause on hover", async ({ page, isMobile }) => {
  await page.goto("/");
  const track = page.locator("#reviews [class*=reviewTrack]");
  // the track is always moving, so scroll to it directly instead of waiting for it to hold still
  await track.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const x = () => track.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);

  const first = await x();
  await page.waitForTimeout(600);
  expect(await x()).toBeLessThan(first); // moving left on its own

  if (!isMobile) {
    await page.mouse.move(640, 450);
    await track.hover({ force: true });
    await page.waitForTimeout(150);
    const paused = await x();
    await page.waitForTimeout(500);
    expect(await x()).toBe(paused);
  }
});

test("product cards fade up as they scroll into view", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("#arrivals article").first();
  await card.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect.poll(() => card.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
});
