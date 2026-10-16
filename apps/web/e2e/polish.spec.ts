import { expect, test } from "@playwright/test";
import { fabrics } from "../src/lib/catalog";

test.describe("search and menu open the catalogue filtered", () => {
  for (const fabric of fabrics) {
    test(`searching ${fabric} ticks it and lists only those sarees`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Search catalog" }).click();
      await page.getByRole("dialog").getByRole("link", { name: fabric, exact: true }).click();
      await expect(page).toHaveURL(/new-arrivals\?fabric=/);

      const box = page.getByRole("checkbox", { name: new RegExp(`^${fabric}`) });
      await expect(box).toBeChecked();
      // the count in the filter label is how many sarees of that fabric exist; the list header must say the same
      const expected = Number((await box.locator("xpath=..").innerText()).match(/\((\d+)\)/)![1]);
      await expect(page.getByText(new RegExp(`^${expected} Products?$`))).toBeVisible();
      // and every other fabric is left unticked
      await expect(page.locator("input[type=checkbox]:checked").filter({ has: page.locator("xpath=..") })).toHaveCount(1);
    });
  }

  test("typing an everyday name finds the fabric (kanchipuram)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search catalog" }).click();
    await page.locator("#catalog-search").fill("kanchipuram");
    await page.getByRole("dialog").getByRole("link", { name: "Kanchi Pattu Saree" }).click();
    await expect(page.getByRole("checkbox", { name: /^Kanchi Pattu Saree/ })).toBeChecked();
  });

  test("a Shop menu fabric link does the same, and plain New Arrivals clears it", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("button", { name: /Shop/ }).click();
    await page.getByRole("navigation", { name: "Shop sections" }).getByRole("link", { name: "Banarasi" }).click();
    await expect(page.getByRole("checkbox", { name: /^Banarasi Saree/ })).toBeChecked();
    await page.getByRole("button", { name: "Search catalog" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "New Arrivals", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: /^Banarasi Saree/ })).not.toBeChecked();
  });
});

test.describe("home page polish", () => {
  test("both faces in the try-on slider are cut exactly in half by the divider", async ({ page }) => {
    await page.goto("/");
    const slider = page.locator("#try-on [class*=compare]").first();
    await slider.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(500);
    const frame = (await slider.boundingBox())!;
    const centre = frame.x + frame.width / 2;
    const faceX = async (index: number, fraction: number) => {
      const box = (await slider.locator("img").nth(index).boundingBox())!;
      return box.x + box.width * fraction;
    };
    expect(Math.abs((await faceX(0, 0.48)) - centre)).toBeLessThan(2); // result picture (right half)
    expect(Math.abs((await faceX(1, 0.52)) - centre)).toBeLessThan(2); // your photo (left half)
  });

  test("try-on access cards leave room between title, badge, text and button", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#try-on article").nth(1);
    await card.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(900); // let the scroll-in animation finish before measuring
    const gap = async (upper: string, lower: string) => {
      const a = (await card.locator(upper).first().boundingBox())!;
      const b = (await card.locator(lower).first().boundingBox())!;
      return b.y - (a.y + a.height);
    };
    expect(await gap("h3", "[class*=badge]")).toBeGreaterThanOrEqual(10);
    expect(await gap("[class*=badge]", "p")).toBeGreaterThanOrEqual(16);
    expect(await gap("p", "button")).toBeGreaterThanOrEqual(16);
  });

  test("social icons keep their own proportions inside a 48px chip", async ({ page }) => {
    await page.goto("/");
    await page.locator("#socials").evaluate((element) => element.scrollIntoView());
    await page.waitForTimeout(600);
    const chips = page.locator("#socials [class*=platform]");
    await expect(chips).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const chip = (await chips.nth(i).boundingBox())!;
      expect(Math.round(chip.width)).toBe(48);
      const icon = chips.nth(i).locator("img");
      await expect.poll(() => icon.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      const ratio = await icon.evaluate((image: HTMLImageElement) => [image.getBoundingClientRect().width / image.getBoundingClientRect().height, image.naturalWidth / image.naturalHeight]);
      expect(Math.abs(ratio[0] - ratio[1]), `icon ${i} is not stretched`).toBeLessThan(0.02);
    }
  });

  test("Join our world text and Why Pratyangi cards animate in as they are scrolled to", async ({ page }) => {
    await page.goto("/");
    const opacity = (selector: string) => page.locator(selector).first().evaluate((element) => Number(getComputedStyle(element).opacity));

    // not yet scrolled to: still hidden
    expect(await opacity("#join h2")).toBe(0);
    await page.locator("#join h2").evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect.poll(() => opacity("#join h2")).toBe(1);
    await expect.poll(() => opacity("#join p")).toBe(1);

    const why = page.locator("#why-pratyangi article").first();
    await why.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect.poll(() => why.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
  });
});
