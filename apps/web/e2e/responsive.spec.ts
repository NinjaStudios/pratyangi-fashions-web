import { expect, test } from "@playwright/test";
import { scrollThrough } from "./helpers";

// Every page must fit every phone / tablet / laptop width: nothing wider than the screen, header icons comfortable to tap.
const widths = [320, 360, 375, 414, 480, 600, 768, 900, 1024, 1280];
const pages = ["/", "/new-arrivals", "/bag", "/checkout", "/account", "/account/orders"];

test.describe.configure({ mode: "parallel" });
test.skip(({ isMobile }) => isMobile, "widths are set by the test itself; the desktop project covers them");

for (const width of widths) {
  test(`nothing overflows at ${width}px wide`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 800 });
    for (const path of pages) {
      await page.goto(path);
      await scrollThrough(page);
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const wide = [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((element) => {
            const box = element.getBoundingClientRect();
            if (!box.width || !box.height || box.right <= viewport + 1) return false;
            // content inside a deliberately scrolling row (carousel, marquee, tabs) may extend past the screen
            for (let parent = element.parentElement; parent; parent = parent.parentElement) {
              const style = getComputedStyle(parent);
              if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) return false;
            }
            return getComputedStyle(element).position !== "fixed";
          })
          .slice(0, 3)
          .map((element) => `${element.tagName}.${String(element.className).slice(0, 40)}`);
        return { pageWider: document.documentElement.scrollWidth > viewport, wide };
      });
      expect(overflow.pageWider, `${path}: page is wider than ${width}px`).toBe(false);
      expect(overflow.wide, `${path}: elements stick out past the right edge at ${width}px`).toEqual([]);
    }
  });
}

test("header icons are the same weight and comfortable to tap on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const bag = (await page.getByRole("link", { name: /Open your bag/ }).boundingBox())!;
  const account = (await page.getByRole("link", { name: "My account" }).boundingBox())!;
  const search = (await page.getByRole("button", { name: "Search catalog" }).boundingBox())!;
  for (const target of [bag, account, search]) {
    expect(target.height).toBeGreaterThanOrEqual(40);
    expect(target.width).toBeGreaterThanOrEqual(32);
  }
  const glyph = (name: string | RegExp, role: "link" | "button") =>
    page.getByRole(role, { name }).locator("svg").first().evaluate((svg) => svg.getBoundingClientRect().width);
  const sizes = [await glyph(/Open your bag/, "link"), await glyph("My account", "link"), await glyph("Search catalog", "button")];
  expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(10);
});

test("the New Arrivals filters start folded on a phone and open with one tap", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/new-arrivals");
  await expect(page.getByRole("group", { name: "Fabric" })).toBeHidden();
  await page.getByRole("button", { name: /Filters/ }).click();
  await expect(page.getByRole("group", { name: "Fabric" })).toBeVisible();
});
