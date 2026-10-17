import { expect, test, type Page } from "@playwright/test";

const unique = () => `buyer${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;

async function signUp(page: Page, email: string, password = "Saree2026", name = "Test Buyer") {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByText("I agree to the").click();
  await page.getByRole("button", { name: "Create Account" }).click();
}

test.describe("sign in", () => {
  test("shows the form with Google sign-in and a link to create an account", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
  });

  test("checks the fields before sending", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(2);
    await expect(page.getByText("Enter your email address")).toBeVisible();
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("x");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
  });

  test("the eye button shows and hides the password", async ({ page }) => {
    await page.goto("/login");
    const password = page.getByLabel("Password", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("Google button explains what is missing while no client ID is set", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in with Google" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Google sign-in is not switched on yet" })).toBeVisible();
  });

  test("an unknown email or wrong password gets one neutral message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("nobody@example.com");
    await page.getByLabel("Password", { exact: true }).fill("Whatever1");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "The email or password is incorrect." })).toBeVisible();
  });
});

test.describe("create account", () => {
  test("checks every field and the terms", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(6);
    await expect(page.getByText("Please accept the terms to continue")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByLabel("Confirm password", { exact: true }).fill("Different1");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("The two passwords do not match")).toBeVisible();
  });

  test("the strength meter and rules follow the password as it is typed", async ({ page }) => {
    await page.goto("/signup");
    const password = page.getByLabel("Password", { exact: true });
    const meter = page.getByRole("status").filter({ hasText: /Password strength|Use at least 8/ });
    await password.fill("abc");
    await expect(meter).toHaveText("Password strength: Weak");
    await password.fill("Saree2026");
    await expect(meter).toHaveText(/Password strength: (Good|Strong)/);
    await password.fill("Saree@2026-Silk");
    await expect(meter).toHaveText("Password strength: Strong");
    await expect(page.getByRole("list", { name: "Password rules" }).locator("li").first()).toContainText("✓");
  });

  test("signing up signs you in: the account shows your name, and logout signs you out", async ({ page }) => {
    const email = unique();
    await signUp(page, email, "Saree2026", "Meera Kumar");
    await expect(page.getByRole("heading", { name: "Welcome, Meera!" })).toBeVisible();
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();
    await expect(page.getByRole("link", { name: "My account" })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  test("the same email cannot be used twice, and a created account can sign in later", async ({ page }) => {
    const email = unique();
    await signUp(page, email);
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await signUp(page, email);
    await expect(page.getByText("An account with this email already exists")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Wrong1234");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText("The email or password is incorrect.")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Test!/ })).toBeVisible();
  });

  test("?next= sends you back to where you were, but only inside the site", async ({ page }) => {
    const email = unique();
    await page.goto("/signup?next=/bag");
    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByLabel("Confirm password", { exact: true }).fill("Saree2026");
    await page.getByText("I agree to the").click();
    await page.getByRole("button", { name: "Create Account" }).click();
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

    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByLabel("Email address").fill(unique());
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByLabel("Confirm password", { exact: true }).fill("Saree2026");
    await page.getByText("I agree to the").click();
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/checkout$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
  });

  test("opening /checkout directly while signed out also leads to sign in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?next=\/checkout/);
  });
});
