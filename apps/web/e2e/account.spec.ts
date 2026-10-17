import { expect, test } from "@playwright/test";

// The order dashboard ("Pratyangi Fashions order dashboard" in Figma).
test.describe("order dashboard", () => {
  test("shows the sidebar, search and sort, order cards and 13 pages of orders", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: "My Orders", level: 1 })).toBeVisible();
    for (const label of ["Overview", "My Orders", "Wishlist", "Addresses", "Payment Methods", "Membership", "My Reviews", "Notifications", "Help & Support"]) {
      await expect(page.getByRole("navigation", { name: "Account sections" }).getByText(label, { exact: true })).toBeVisible();
    }
    // signed out (the default here) the sidebar offers sign-in where Logout sits once signed in
    await expect(page.getByRole("link", { name: "Sign in to your account" })).toBeVisible();
    await expect(page.getByLabel("Search your orders")).toBeVisible();
    await expect(page.locator("[class*=orderCard]")).toHaveCount(4);
    const pages = page.getByRole("navigation", { name: "Order pages" });
    await expect(pages.getByRole("button", { name: "Page 13", exact: true })).toBeVisible();
    await expect(pages.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(pages.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });

  test("the page numbers show different orders, and search and sort work", async ({ page }) => {
    await page.goto("/account/orders");
    const firstId = () => page.locator("[class*=orderId]").first().innerText();
    const before = await firstId();
    await page.getByRole("button", { name: "Page 2", exact: true }).click();
    await expect.poll(firstId).not.toBe(before);
    await expect(page.getByRole("button", { name: "Page 2", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByRole("button", { name: "Page 3", exact: true })).toHaveAttribute("aria-current", "page");

    await page.getByLabel("Search your orders").fill("PF123456");
    await expect(page.locator("[class*=orderCard]")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Order pages" })).toBeHidden();
    await page.getByLabel("Search your orders").fill("zzz");
    await expect(page.getByText("No orders match your search.")).toBeVisible();
  });

  test("Buy Again puts the first item in the bag", async ({ page }) => {
    await page.goto("/account/orders");
    await page.getByRole("button", { name: "Buy Again" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: "added to your bag" })).toBeVisible();
  });
});
