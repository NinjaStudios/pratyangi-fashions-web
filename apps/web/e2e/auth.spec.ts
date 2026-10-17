import { expect, test, type Page } from "@playwright/test";

// Demo mode sends no SMS or email: every code is this one (see lib/auth/demoAuth.ts).
const demoCode = "123456";
const rand = () => Math.floor(100000000 + Math.random() * 899999999);
const unique = () => ({ phone: `9${rand()}`, email: `buyer${Date.now()}${rand()}@example.com` });

type Person = { name?: string; phone: string; email: string; password?: string };

/** Fills the signup details and sends the codes: ends on the "Verify your details" step. */
async function startSignup(page: Page, person: Person, path = "/signup") {
  await page.goto(path);
  await page.getByLabel("Full name").fill(person.name ?? "Test Buyer");
  await page.getByLabel("Email address").fill(person.email);
  await page.getByLabel("Mobile number").fill(person.phone);
  await page.getByLabel("Password", { exact: true }).fill(person.password ?? "Saree2026");
  await page.getByLabel("Confirm password", { exact: true }).fill(person.password ?? "Saree2026");
  await page.getByText("I agree to the").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Verify your details", level: 1 })).toBeVisible();
}

async function signUp(page: Page, person: Person, path = "/signup") {
  await startSignup(page, person, path);
  await page.getByLabel("Mobile code").fill(demoCode);
  await page.getByLabel("Email code").fill(demoCode);
  await page.getByRole("button", { name: "Verify & Create Account" }).click();
}

async function signInWithPassword(page: Page, identifier: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email or mobile number").fill(identifier);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
}

test.describe("sign in", () => {
  test("offers Google, email or mobile with a password, a mobile-code option and a reset link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
    await expect(page.getByLabel("Email or mobile number")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
    await expect(page.getByRole("button", { name: "Sign in with a mobile code instead" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
  });

  test("checks the fields before sending", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(2);
    await expect(page.getByText("Enter your email or mobile number")).toBeVisible();
    await page.getByLabel("Email or mobile number").fill("not-an-email@");
    await page.getByLabel("Password", { exact: true }).fill("x");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
    await page.getByLabel("Email or mobile number").fill("12345");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText("Enter a valid 10-digit mobile number")).toBeVisible();
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
    await signInWithPassword(page, "nobody@example.com", "Whatever1");
    await expect(page.getByRole("alert").filter({ hasText: "The email or mobile number, or the password, is incorrect." })).toBeVisible();
  });

  test("the mobile-code option needs an existing account, then signs in with the code", async ({ page }) => {
    const person = unique();
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in with a mobile code instead" }).click();
    await page.getByLabel("Mobile number").fill(person.phone);
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.getByText("We could not find an account with this mobile number")).toBeVisible();

    await signUp(page, person);
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in with a mobile code instead" }).click();
    await page.getByLabel("Mobile number").fill(person.phone);
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.getByRole("status").filter({ hasText: `Use the code ${demoCode}` })).toBeVisible();
    await page.getByLabel("One-time code").fill("111111");
    await page.getByRole("button", { name: "Verify & Sign In" }).click();
    await expect(page.getByText("That code is not correct")).toBeVisible();
    await page.getByLabel("One-time code").fill(demoCode);
    await page.getByRole("button", { name: "Verify & Sign In" }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Test!/ })).toBeVisible();
  });
});

test.describe("create account", () => {
  test("checks every field and the terms", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(6);
    await expect(page.getByText("Please accept the terms to continue")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByLabel("Confirm password", { exact: true }).fill("Different1");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("The two passwords do not match")).toBeVisible();
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

  test("codes go to the mobile and the email, both are needed, and then the account is created", async ({ page }) => {
    const person = { ...unique(), name: "Meera Kumar" };
    await startSignup(page, person);
    await expect(page.getByText(`+91 ${person.phone.slice(0, 5)} ${person.phone.slice(5)}`)).toBeVisible();
    await expect(page.getByText(person.email, { exact: false }).first()).toBeVisible();

    // one wrong code is refused and says which one
    await page.getByLabel("Mobile code").fill(demoCode);
    await page.getByLabel("Email code").fill("111111");
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page.getByText("That email code is not correct")).toBeVisible();

    await page.getByLabel("Email code").fill(demoCode);
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page.getByRole("heading", { name: "Welcome, Meera!" })).toBeVisible();
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();
    await expect(page.getByRole("link", { name: "My account" })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  test("resend waits, Edit details goes back, and the same email or mobile cannot register twice", async ({ page }) => {
    const person = unique();
    await startSignup(page, person);
    await expect(page.getByRole("button", { name: /Resend mobile code in \d+s/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Resend email code in \d+s/ })).toBeDisabled();
    await page.getByRole("button", { name: "Edit details" }).click();
    await expect(page.getByLabel("Full name")).toHaveValue("Test Buyer");

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Mobile code").fill(demoCode);
    await page.getByLabel("Email code").fill(demoCode);
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Someone Else");
    await page.getByLabel("Email address").fill(person.email);
    await page.getByLabel("Mobile number").fill(`9${rand()}`);
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByLabel("Confirm password", { exact: true }).fill("Saree2026");
    await page.getByText("I agree to the").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("An account with this email already exists")).toBeVisible();
  });

  test("a created account signs in later with its email, or its mobile number, and the password", async ({ page }) => {
    const person = unique();
    await signUp(page, person);
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await signInWithPassword(page, person.email, "Wrong1234");
    await expect(page.getByText("is incorrect")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("Saree2026");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Test!/ })).toBeVisible();
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await signInWithPassword(page, `+91 ${person.phone}`, "Saree2026");
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
    await expect(page.getByText("Enter your email or mobile number")).toBeVisible();
    await page.getByLabel("Email or mobile number").fill(person.email);
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByRole("heading", { name: "Set a new password", level: 1 })).toBeVisible();
    await expect(page.getByText(/b\*+@example\.com/)).toBeVisible();

    await page.getByLabel("Code", { exact: true }).fill("111111");
    await page.getByLabel("New password", { exact: true }).fill("NewSaree2027");
    await page.getByLabel("Confirm new password", { exact: true }).fill("NewSaree2027");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByText("That code is not correct")).toBeVisible();

    await page.getByLabel("Code", { exact: true }).fill(demoCode);
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();

    await page.getByRole("link", { name: "Sign In", exact: true }).click();
    await signInWithPassword(page, person.email, "Saree2026");
    await expect(page.getByText("is incorrect")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("NewSaree2027");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Test!/ })).toBeVisible();
  });

  test("looks the same for an account that does not exist, and the mobile number works too", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email or mobile number").fill("98765 43210");
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByRole("heading", { name: "Set a new password", level: 1 })).toBeVisible();
    await expect(page.getByText(/\+91 \*+210/)).toBeVisible();
    await page.getByLabel("Code", { exact: true }).fill(demoCode);
    await page.getByLabel("New password", { exact: true }).fill("NewSaree2027");
    await page.getByLabel("Confirm new password", { exact: true }).fill("NewSaree2027");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByText("That code is not correct")).toBeVisible();
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

    await startSignup(page, unique(), "/signup?next=/checkout");
    await page.getByLabel("Mobile code").fill(demoCode);
    await page.getByLabel("Email code").fill(demoCode);
    await page.getByRole("button", { name: "Verify & Create Account" }).click();
    await expect(page).toHaveURL(/\/checkout$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
  });

  test("opening /checkout directly while signed out also leads to sign in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?next=\/checkout/);
  });
});
