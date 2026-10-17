import { expect, test, type Page } from "@playwright/test";

// These tests run against a build with NEXT_PUBLIC_AUTH_DEMO=true (browser-only stand-in, see lib/auth/demoAuth.ts).
// The real server is covered by apps/api/test and by e2e-api.
const demoCode = "123456";
const rand = () => Math.floor(100000000 + Math.random() * 899999999);
const unique = () => ({ name: "Test Buyer", email: `buyer${Date.now()}${rand()}@example.com`, password: "Saree2026" });

type Person = { name?: string; email: string; password?: string };

async function signUp(page: Page, person: Person, path = "/signup") {
  await page.goto(path);
  await page.getByLabel("Full name").fill(person.name ?? "Test Buyer");
  await page.getByLabel("Email address").fill(person.email);
  await page.getByLabel("Password", { exact: true }).fill(person.password ?? "Saree2026");
  await page.getByLabel("Confirm password", { exact: true }).fill(person.password ?? "Saree2026");
  await page.getByText("I agree to the").click();
  await page.getByRole("button", { name: "Create Account" }).click();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
}

test.describe("sign in", () => {
  test("offers Google, email and password, and a reset link, with no mobile number", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel(/mobile/i)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
  });

  test("says what is wrong with each field before sending", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(2);
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
    await page.getByLabel("Email address").fill("not-an-email@");
    await page.getByLabel("Password", { exact: true }).fill("x");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText("Enter a valid email address, like name@example.com.")).toBeVisible();
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

  test("an unknown account or a wrong password gets one neutral message", async ({ page }) => {
    await signIn(page, "nobody@example.com", "Whatever1");
    await expect(page.getByRole("alert").filter({ hasText: "The email or password is incorrect." })).toBeVisible();
  });
});

test.describe("create account", () => {
  test("says what is wrong with each field and with the terms", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(5);
    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await expect(page.getByText("Create a password.")).toBeVisible();
    await expect(page.getByText("Re-enter your password.")).toBeVisible();
    await expect(page.getByText("Please accept the terms to continue.")).toBeVisible();

    await page.getByLabel("Full name").fill("A");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByLabel("Confirm password", { exact: true }).fill("Different1");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Enter your full name (at least 2 characters).")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
    await expect(page.getByText("The two passwords do not match.")).toBeVisible();

    await page.getByLabel("Password", { exact: true }).fill("abcdefgh");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Password needs at least one number.")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("12345678");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Password needs at least one letter.")).toBeVisible();
  });

  test("asks for name, email and password only, no mobile number", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel(/mobile|phone/i)).toHaveCount(0);
  });

  test("the strength meter and rules follow the password as it is typed", async ({ page }) => {
    await page.goto("/signup");
    const password = page.getByLabel("Password", { exact: true });
    const meter = page.getByRole("status").filter({ hasText: /Password strength|Use at least 8/ });
    await password.fill("abc");
    await expect(meter).toHaveText("Password strength: Weak");
    await password.fill("Saree@2026-Silk");
    await expect(meter).toHaveText("Password strength: Strong");
    await expect(page.getByRole("list", { name: "Password rules" }).locator("li").first()).toContainText("✓");
  });

  test("signing up signs you in: the account shows your name, and logout signs you out", async ({ page }) => {
    await signUp(page, { ...unique(), name: "Meera Kumar" });
    await expect(page.getByRole("heading", { name: "Welcome, Meera!" })).toBeVisible();
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();
    await expect(page.getByRole("link", { name: "My account" })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  test("the same email cannot register twice, and a created account signs in later", async ({ page }) => {
    const person = unique();
    await signUp(page, person);
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await signUp(page, { ...person, email: person.email.toUpperCase() });
    await expect(page.getByText("An account with this email already exists. Please sign in instead.")).toBeVisible();

    await signIn(page, person.email, "Wrong1234");
    await expect(page.getByText("The email or password is incorrect.")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Test!/ })).toBeVisible();
  });

  test("?next= sends you back to where you were, but only inside the site", async ({ page }) => {
    await signUp(page, unique(), "/signup?next=/bag");
    await expect(page).toHaveURL(/\/bag$/, { timeout: 8000 });
  });
});

test.describe("forgot password", () => {
  test("a code by email, a new password, then signing in with it", async ({ page }) => {
    const person = unique();
    await signUp(page, person);
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page.getByRole("heading", { name: "Forgot your password?", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await page.getByLabel("Email address").fill(person.email);
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByRole("heading", { name: "Set a new password", level: 1 })).toBeVisible();

    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByText("Enter the 6-digit code.")).toBeVisible();
    await page.getByLabel("Code", { exact: true }).fill("111111");
    await page.getByLabel("New password", { exact: true }).fill("NewSaree2027");
    await page.getByLabel("Confirm new password", { exact: true }).fill("NewSaree2027");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByText("That code is not correct. Please check it and try again.")).toBeVisible();

    await page.getByLabel("Code", { exact: true }).fill(demoCode);
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();

    await page.getByRole("link", { name: "Sign In", exact: true }).click();
    await signIn(page, person.email, "Saree2026");
    await expect(page.getByText("The email or password is incorrect.")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("NewSaree2027");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Test!/ })).toBeVisible();
  });
});

test("signed out, the header icon leads to sign in and the account page offers it too", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await page.goto("/account");
  await expect(page.getByRole("link", { name: "Sign in to your account" })).toBeVisible();
});

test.describe("checkout needs an account", () => {
  test("signed out, Proceed to Checkout opens sign in, and creating an account lands on checkout", async ({ page }) => {
    await page.goto("/bag");
    await page.getByRole("link", { name: /Proceed to Checkout/ }).click();
    await expect(page).toHaveURL(/\/login\?next=\/checkout/);
    await expect(page.getByText("Please sign in to continue to checkout")).toBeVisible();
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/signup\?next=\/checkout/);

    await signUp(page, unique(), "/signup?next=/checkout");
    await expect(page).toHaveURL(/\/checkout$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
  });

  test("opening /checkout directly while signed out also leads to sign in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?next=\/checkout/);
  });
});
