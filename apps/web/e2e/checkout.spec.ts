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

// Checkout needs an account, so these tests start signed in (the demo session lives in localStorage).
const signedIn = { id: "u1", name: "Test Buyer", phone: "9876543210", provider: "password" };

test.describe("checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => window.localStorage.setItem("pratyangi-demo-session", JSON.stringify(user)), signedIn);
  });

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

  test("a new address starts with the signed-in name and mobile number filled in", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Add New Address/ }).click();
    const dialog = page.getByRole("dialog", { name: "Add new Address" });
    await expect(dialog.getByLabel("Full Name", { exact: true })).toHaveValue("Test Buyer");
    await expect(dialog.getByLabel("Phone Number", { exact: true })).toHaveValue("9876543210");
  });

  test("Add New Address opens the two-pane address dialog: My Addresses and the form", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Add New Address/ }).click();
    const dialog = page.getByRole("dialog", { name: "Add new Address" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "My Addresses" })).toBeVisible();
    await expect(dialog.getByText("Manage your delivery addresses for a faster checkout.")).toBeVisible();
    // the saved addresses from the design: Home (default), Office and PG
    for (const label of ["Edit Home address", "Edit Office address", "Edit PG address"]) await expect(dialog.getByRole("button", { name: label })).toBeVisible();
    await expect(dialog.getByText("Default", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /Home/ }).first()).toBeChecked();
    // the form
    for (const label of ["Full Name", "Phone Number", "Pincode", "House / Flat / Building No.", "Street / Area / Landmark", "City", "Address Type Label (Optional)"]) {
      await expect(dialog.getByLabel(label, { exact: true })).toBeVisible();
    }
    await expect(dialog.getByRole("button", { name: "Check Pincode" })).toBeVisible();
    await expect(dialog.getByText("This address will be selected by default at checkout.")).toBeVisible();
  });

  test("the address form checks its fields, then saves, selects and defaults the new address", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Add New Address/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Full Name", { exact: true })).toBeFocused();

    // name and mobile come pre-filled from the account; clear them to check every field is required
    await dialog.getByLabel("Full Name", { exact: true }).fill("");
    await dialog.getByLabel("Phone Number", { exact: true }).fill("");
    await dialog.getByRole("button", { name: "Save Address" }).click();
    await expect(dialog.getByRole("alert")).toHaveCount(7);

    await dialog.getByLabel("Full Name", { exact: true }).fill("Test Buyer");
    await dialog.getByLabel("Phone Number", { exact: true }).fill("9000000000");
    await dialog.getByLabel("Pincode", { exact: true }).fill("500001");
    await dialog.getByRole("button", { name: "Check Pincode" }).click();
    await expect(dialog.getByText("Delivery available in Hyderabad, Telangana")).toBeVisible();
    await expect(dialog.getByLabel("City", { exact: true })).toHaveValue("Hyderabad"); // filled in by the pincode check
    await expect(dialog.getByLabel("State", { exact: true })).toHaveValue("Telangana");
    await dialog.getByLabel("House / Flat / Building No.", { exact: true }).fill("12");
    await dialog.getByLabel("Street / Area / Landmark", { exact: true }).fill("Test Street");
    await dialog.getByRole("radio", { name: /For workplace delivery/ }).check({ force: true });
    await dialog.getByLabel("Address Type Label (Optional)", { exact: true }).fill("Studio");
    await dialog.getByText("Set as default address").click();
    await dialog.getByRole("button", { name: "Save Address" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("12, Test Street, Hyderabad, Telangana - 500001")).toBeVisible();
    await expect(page.getByRole("radio", { name: /Studio.*DEFAULT.*Test Buyer/s })).toBeChecked();
    await expect(page.getByText("DEFAULT", { exact: true })).toHaveCount(1);
  });

  test("in the dialog an address can be edited, set as default or deleted, and Esc closes it", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Add New Address/ }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("button", { name: "Edit PG address" }).click();
    await expect(dialog.getByRole("heading", { name: "Edit Address" })).toBeVisible();
    await expect(dialog.getByLabel("Address Type Label (Optional)", { exact: true })).toHaveValue("PG");
    await expect(dialog.getByLabel("House / Flat / Building No.", { exact: true })).toHaveValue("Room 12, Sunrise PG");

    await dialog.getByRole("button", { name: "More options for Office" }).click();
    await dialog.getByRole("menuitem", { name: "Set as default" }).click();
    await expect(dialog.locator("[class*=card]").filter({ hasText: "Office" }).getByText("Default", { exact: true })).toBeVisible();

    await expect(dialog.getByRole("menu")).toHaveCount(0); // the first menu has finished closing
    await dialog.getByRole("button", { name: "More options for PG" }).click();
    await dialog.getByRole("menuitem", { name: "Delete" }).click();
    await expect(dialog.getByRole("button", { name: "Edit PG address" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: /Add New Address/ })).toBeFocused();
  });

  test("Edit on the checkout list opens the dialog on that address", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: /Edit/ }).first().click();
    const dialog = page.getByRole("dialog", { name: "Edit Address" });
    await expect(dialog.getByLabel("Full Name", { exact: true })).toHaveValue("Gaurav Kumar");
    await expect(dialog.getByLabel("Pincode", { exact: true })).toHaveValue("530013");
    await dialog.getByLabel("Full Name", { exact: true }).fill("Gaurav K");
    await dialog.getByRole("button", { name: "Save Address" }).click();
    await expect(page.getByText("Gaurav K", { exact: true })).toBeVisible();
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

    // the review step can go back, one step or all the way to delivery, and keeps the choices
    await page.getByRole("button", { name: "← Back to payment" }).click();
    await expect(page.getByRole("heading", { name: "Payment Method" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Cash on delivery/ })).toBeChecked();
    await page.getByRole("button", { name: /Review Order/ }).click();
    await page.getByRole("button", { name: "← Back to delivery" }).click();
    await expect(page.getByRole("heading", { name: "Delivery Address" })).toBeVisible();
    await page.getByRole("button", { name: /Proceed to Pay/ }).click();
    await page.getByRole("button", { name: /Review Order/ }).click();

    await page.getByRole("button", { name: /Place Order/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "not available in this local demo" })).toBeVisible();
  });

  test("standard delivery is free, as in the design", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("radio", { name: /Standard Delivery/ })).toBeChecked();
    await expect(page.locator("[class*=prices]").getByText("FREE")).toBeVisible();
  });
});
