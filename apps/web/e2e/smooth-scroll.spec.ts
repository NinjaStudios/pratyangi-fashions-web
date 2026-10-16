import { expect, test } from "@playwright/test";

// Mouse-wheel scrolling is eased (Lenis): the page glides to its target over several frames instead of jumping.
test("mouse wheel scrolling glides instead of jumping", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch scrolling stays native");
  await page.goto("/");
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 600);

  const samples: number[] = [];
  for (let i = 0; i < 8; i++) {
    samples.push(await page.evaluate(() => Math.round(window.scrollY)));
    await page.waitForTimeout(40);
  }
  // it moved, it moved in more than one step, and it never went backwards
  expect(samples.at(-1)).toBeGreaterThan(100);
  expect(new Set(samples).size).toBeGreaterThan(2);
  for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);

  // and it settles on the requested distance
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 }).toBeGreaterThan(500);
});
