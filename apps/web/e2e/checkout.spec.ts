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
    await page.mouse.click(5, (page.viewportSize()?.height ?? 800) - 5);
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

  test("Add New Address opens the address dialog, checks the fields, then saves and selects the address", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Add New Address/ }).click();
    const dialog = page.getByRole("dialog", { name: "Add New Address" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Full name")).toBeFocused();

    // empty form: every required field explains itself
    await dialog.getByRole("button", { name: "Save Address" }).click();
    await expect(dialog.getByRole("alert")).toHaveCount(7);
    await expect(dialog.getByText("Enter a 6-digit pincode")).toBeVisible();

    await dialog.getByLabel("Full name").fill("Test Buyer");
    await dialog.getByLabel("Mobile number").fill("9000000000");
    await dialog.getByLabel("Pincode").fill("500001");
    await dialog.getByLabel("City").fill("Hyderabad");
    await dialog.getByLabel("State").fill("Telangana");
    await dialog.getByLabel("Flat, house no., building").fill("12");
    await dialog.getByLabel("Area, street, village").fill("Test Street");
    await dialog.getByText("Office", { exact: true }).click();
    await dialog.getByText("Make this my default address").click();
    await dialog.getByRole("button", { name: "Save Address" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("12, Test Street, Hyderabad, Telangana - 500001")).toBeVisible();
    await expect(page.getByRole("radio", { name: /Office.*DEFAULT.*Test Buyer/s })).toBeChecked();
    // it became the only default
    await expect(page.getByText("DEFAULT", { exact: true })).toHaveCount(1);
  });

  test("an address can be edited in the same dialog, Esc closes it, and Delete removes one", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Edit/ }).first().click();
    const dialog = page.getByRole("dialog", { name: "Edit Address" });
    await expect(dialog.getByLabel("Full name")).toHaveValue("Gaurav Kumar");
    await expect(dialog.getByLabel("Pincode")).toHaveValue("530013");
    await dialog.getByLabel("Full name").fill("Gaurav K");
    await dialog.getByRole("button", { name: "Save Address" }).click();
    await expect(page.getByText("Gaurav K", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Add New Address/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: /Add New Address/ })).toBeFocused();

    const deletes = page.getByRole("button", { name: "Delete" });
    const count = await deletes.count();
    await deletes.first().click();
    await expect(deletes).toHaveCount(count - 1);
  });

  test("a coupon applied in the bag is already applied at checkout", async ({ page }) => {
    await page.goto("/bag");
    await page.getByPlaceholder("Enter coupon code").fill("FIRST20");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/FIRST20 applied/)).toBeVisible();
    await page.getByRole("link", { name: /Proceed to Checkout/ }).click();
    await expect(page.getByText("Discount (FIRST20)")).toBeVisible();
    await expect(page.getByText(/You are saving/)).toBeVisible();
  });

  test("the steps move from delivery to payment to review, and placing the order is a demo", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Proceed to Pay/ }).click();
    await expect(page.getByRole("heading", { name: "Payment Method" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Payment" }).first()).toHaveAttribute("aria-current", "step");

    await page.getByText("Cash on delivery", { exact: true }).click();
    await expect(page.getByRole("radio", { name: /Cash on delivery/ })).toBeChecked();
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
