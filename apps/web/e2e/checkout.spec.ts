import { expect, test } from "@playwright/test";

test.describe("Shop menu", () => {
  test("opens with the Women / Men / Jewellery columns and the icon turns into a cross", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("header").getByRole("button", { name: /Shop/ });
    const menu = page.getByRole("navigation", { name: "Shop sections" });
    const bars = page.locator("header [data-open]");

    await expect(bars).toHaveAttribute("data-open", "false");
    await toggle.click();
    await expect(bars).toHaveAttribute("data-open", "true");
    await expect(menu.getByRole("heading", { name: "WOMEN" })).toBeVisible();
    await expect(menu.getByRole("heading", { name: "MEN", exact: true })).toBeVisible();
    await expect(menu.getByRole("heading", { name: "JEWELLERY" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Half Sarees" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Accessories" })).toBeVisible();

    // clicking outside closes it again
    await page.mouse.click(5, 600);
    await expect(menu).toBeHidden();
    await expect(bars).toHaveAttribute("data-open", "false");
  });

  test("a menu link goes to the catalogue and closes the menu", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("button", { name: /Shop/ }).click();
    await page.getByRole("navigation", { name: "Shop sections" }).getByRole("link", { name: "Banarasi" }).click();
    await expect(page).toHaveURL(/new-arrivals/);
  });
});

test.describe("checkout", () => {
  test("the bag leads to checkout", async ({ page }) => {
    await page.goto("/bag");
    await page.getByRole("link", { name: /Proceed to Checkout/ }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
  });

  test("shows the address, delivery options and order summary", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("Gaurav Kumar").first()).toBeVisible();
    await expect(page.getByRole("radio", { name: /Home/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: /Standard Delivery/ })).toBeChecked();
    await expect(page.getByRole("heading", { name: "Order Summary" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Proceed to Pay/ })).toBeEnabled();
  });

  test("express delivery adds its fee, and a coupon lowers the total", async ({ page }) => {
    await page.goto("/checkout");
    const totalOf = async () => Number((await page.locator("[class*=total] strong").innerText()).replace(/[^\d]/g, ""));
    await expect.poll(totalOf).toBeGreaterThan(0);
    const before = await totalOf();

    await page.getByRole("radio", { name: /Express Delivery/ }).check({ force: true });
    await expect.poll(totalOf).toBe(before + 99);

    await page.getByPlaceholder("Enter coupon code").fill("WELCOME10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("WELCOME10 applied")).toBeVisible();
    await expect.poll(totalOf).toBeLessThan(before + 99);
  });

  test("a new address can be added and selected, and one can be deleted", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Add New Address/ }).click();
    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByLabel("Phone").fill("9000000000");
    await page.getByLabel("Address", { exact: true }).fill("12 Test Street, Hyderabad 500001");
    await page.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByText("12 Test Street, Hyderabad 500001")).toBeVisible();

    const deletes = page.getByRole("button", { name: "Delete" });
    const count = await deletes.count();
    await deletes.first().click();
    await expect(deletes).toHaveCount(count - 1);
  });

  test("the steps move from delivery to payment to review, and placing the order is a demo", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Proceed to Pay/ }).click();
    await expect(page.getByRole("heading", { name: "Payment Method" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Payment" }).first()).toHaveAttribute("aria-current", "step");

    await page.getByRole("radio", { name: /Cash on delivery/ }).check({ force: true });
    await page.getByRole("button", { name: /Review Order/ }).click();
    await expect(page.getByRole("heading", { name: /Review & Place Order/ , level: 2 })).toBeVisible();
    await expect(page.getByText("Cash on delivery").first()).toBeVisible();

    await page.getByRole("button", { name: /Place Order/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "not available in this local demo" })).toBeVisible();
  });

  test("standard delivery is free, as in the design", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("radio", { name: /Standard Delivery/ })).toBeChecked();
    await expect(page.locator("[class*=prices]").getByText("FREE")).toBeVisible();
  });
});
