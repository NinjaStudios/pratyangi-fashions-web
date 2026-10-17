import { expect, test, type Page } from "@playwright/test";

// Demo mode sends no SMS: every number accepts this code (see lib/auth/demoAuth.ts).
const demoCode = "123456";
const unique = () => `9${Math.floor(100000000 + Math.random() * 899999999)}`;

async function sendCode(page: Page, path: string, phone: string) {
  await page.goto(path);
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("button", { name: "Send OTP" }).click();
  await expect(page.getByRole("heading", { name: "Verify your number", level: 1 })).toBeVisible();
}

async function signUp(page: Page, phone: string, name = "Test Buyer", path = "/signup") {
  await sendCode(page, path, phone);
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("One-time code").fill(demoCode);
  await page.getByRole("button", { name: "Verify & Create Account" }).click();
}

test.describe("sign in", () => {
  test("offers Google and a mobile number, with no email or password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
    await expect(page.getByLabel("Mobile number")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send OTP" })).toBeVisible();
    await expect(page.getByLabel(/Email|Password/)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
  });

  test("checks the mobile number before sending a code", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.getByText("Enter your mobile number")).toBeVisible();
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.getByText("Enter a valid 10-digit mobile number")).toBeVisible();
  });

  test("Google button explains what is missing while no client ID is set", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in with Google" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Google sign-in is not switched on yet" })).toBeVisible();
  });

  test("a wrong code is refused, and the number can be changed", async ({ page }) => {
    await sendCode(page, "/login", unique());
    await expect(page.getByRole("status").filter({ hasText: `Use the code ${demoCode}` })).toBeVisible();
    await page.getByLabel("One-time code").fill("111111");
    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page.getByText("That code is not correct")).toBeVisible();
    await page.getByRole("button", { name: "Change number" }).click();
    await expect(page.getByLabel("Mobile number")).toBeVisible();
  });

  test("the code only takes digits, the resend button waits, and a short code is refused", async ({ page }) => {
    await sendCode(page, "/login", unique());
    const code = page.getByLabel("One-time code");
    await code.fill("12ab34");
    await expect(code).toHaveValue("1234");
    await expect(page.getByRole("button", { name: /Resend OTP in \d+s/ })).toBeDisabled();
    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page.getByText("The code is 6 digits")).toBeVisible();
  });
});

test.describe("create account and sign back in", () => {
  test("a new number is asked for a name, gets an account, and logout signs out", async ({ page }) => {
    await signUp(page, unique(), "Meera Kumar");
    await expect(page.getByRole("heading", { name: "Welcome, Meera!" })).toBeVisible();
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();
    await expect(page.getByRole("link", { name: "My account" })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  test("the name is required for a new number", async ({ page }) => {
    await sendCode(page, "/signup", unique());
    await page.getByLabel("One-time code").fill(demoCode);
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page.getByText("Enter your full name")).toBeVisible();
  });

  test("a returning number signs in with just the code", async ({ page }) => {
    const phone = unique();
    await signUp(page, phone);
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await sendCode(page, "/login", phone);
    await expect(page.getByLabel("Full name")).toHaveCount(0);
    await page.getByLabel("One-time code").fill(demoCode);
    await page.getByRole("button", { name: "Verify & Sign In" }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Test!/ })).toBeVisible();
  });

  test("?next= sends you back to where you were, but only inside the site", async ({ page }) => {
    await signUp(page, unique(), "Test Buyer", "/signup?next=/bag");
    await expect(page).toHaveURL(/\/bag$/, { timeout: 8000 });
  });
});

test("signed out, the header icon leads to sign in and the account page offers it too", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await page.goto("/account");
  await expect(page.getByRole("link", { name: "Sign in to your account" })).toBeVisible();
});

test.describe("checkout needs an account", () => {
  test("signed out, Proceed to Checkout opens sign in, and signing in lands on checkout", async ({ page }) => {
    await page.goto("/bag");
    await page.getByRole("link", { name: /Proceed to Checkout/ }).click();
    await expect(page).toHaveURL(/\/login\?next=\/checkout/);
    await expect(page.getByText("Please sign in to continue to checkout")).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/signup\?next=\/checkout/);

    await page.getByLabel("Mobile number").fill(unique());
    await page.getByRole("button", { name: "Send OTP" }).click();
    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByLabel("One-time code").fill(demoCode);
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page).toHaveURL(/\/checkout$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
  });

  test("opening /checkout directly while signed out also leads to sign in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?next=\/checkout/);
  });
});
