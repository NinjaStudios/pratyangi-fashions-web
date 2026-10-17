import { expect, test } from "@playwright/test";
import { collectProblems, scrollThrough } from "./helpers";

const pages = [
  { path: "/", title: "Pratyangi Fashions | Tradition Meets Elegance" },
  { path: "/new-arrivals", title: "New Arrivals | Pratyangi Fashions" },
  { path: "/bag", title: "Your Bag | Pratyangi Fashions" },
  { path: "/checkout", title: "Checkout | Pratyangi Fashions" },
  { path: "/login", title: "Sign In | Pratyangi Fashions" },
  { path: "/signup", title: "Create Account | Pratyangi Fashions" },
  { path: "/forgot-password", title: "Reset Password | Pratyangi Fashions" },
  { path: "/account", title: "My Account | Pratyangi Fashions" },
  { path: "/account/orders", title: "My Orders | Pratyangi Fashions" },
];

for (const { path, title } of pages) {
  test(`${path} loads cleanly`, async ({ page }) => {
    // signed in, so /checkout shows the checkout rather than redirecting to sign in
    await page.addInitScript(() => window.localStorage.setItem("pratyangi-demo-session", JSON.stringify({ id: "u1", name: "Test Buyer", email: "buyer@example.com", provider: "password" })));
    const problems = collectProblems(page);

    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await scrollThrough(page);

    const brokenImages = await page.evaluate(() =>
      [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute("src")),
    );
    expect(brokenImages, "images that failed to load").toEqual([]);

    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflows, "page is wider than the screen").toBe(false);

    expect(problems.list(), "console errors or failed requests").toEqual([]);
  });
}
