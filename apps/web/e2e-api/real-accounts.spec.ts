import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const apiUrl = "http://localhost:4001/api/v1";

/** The API runs with no SMTP, so it prints each email to its console, which the config writes to this file. */
async function emailTo(address: string, pattern: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const log = readFileSync("../api/api-e2e.log", "utf8");
      const at = log.lastIndexOf(`To: ${address}`);
      const found = at >= 0 ? pattern.exec(log.slice(at, at + 900)) : null;
      if (found?.[1]) return found[1];
    } catch { /* the file may not exist yet */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`no email to ${address} matching ${pattern}`);
}
const rand = () => Math.floor(100000000 + Math.random() * 899999999);
const unique = (name = "Meera Kumar") => ({ name, email: `real${Date.now()}${rand()}@example.com`, password: "Saree2026" });
type Person = ReturnType<typeof unique>;

async function signUp(page: Page, person: Person, path = "/signup") {
  await page.goto(path);
  await page.getByLabel("Full name").fill(person.name);
  await page.getByLabel("Email address").fill(person.email);
  await page.getByLabel("Password", { exact: true }).fill(person.password);
  await page.getByLabel("Confirm password", { exact: true }).fill(person.password);
  await page.getByText("I agree to the").click();
  await page.getByRole("button", { name: "Create Account" }).click();
}

async function signIn(page: Page, person: Person, password = person.password) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(person.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
}

const address = { name: "Priya Rao", phone: "98765 43210", pincode: "500034", house: "12-3-45", street: "Road No. 5, Banjara Hills", city: "Hyderabad", state: "Telangana" };

async function addAddress(page: Page, values = address) {
  const dialog = page.getByRole("dialog", { name: "Add new Address" });
  await dialog.getByLabel("Full Name", { exact: true }).fill(values.name);
  await dialog.getByLabel("Phone Number", { exact: true }).fill(values.phone);
  await dialog.getByLabel("Pincode", { exact: true }).fill(values.pincode);
  await dialog.getByLabel("House / Flat / Building No.", { exact: true }).fill(values.house);
  await dialog.getByLabel("Street / Area / Landmark", { exact: true }).fill(values.street);
  await dialog.getByLabel("City", { exact: true }).fill(values.city);
  await dialog.getByLabel("State", { exact: true }).selectOption(values.state);
  await dialog.getByRole("button", { name: "Save Address" }).click();
}

test.describe("real accounts (store API + MySQL)", () => {
  test("the site is wired to the server: no demo notice, the session is an httpOnly cookie, and it survives a reload", async ({ page, context }) => {
    const person = unique();
    await page.goto("/signup");
    await expect(page.getByText(/Demo mode/)).toHaveCount(0);
    await expect(page.getByText(/not connected yet/)).toHaveCount(0);

    await signUp(page, person);
    await expect(page.getByRole("heading", { name: "Welcome, Meera!" })).toBeVisible();
    await expect(page).toHaveURL(/\/account$/, { timeout: 10_000 });

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === "pf_session");
    expect(session?.httpOnly).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain("pf_session");
    expect(await page.evaluate(() => JSON.stringify(window.localStorage))).not.toContain(person.email);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/account");
    await expect(page.getByRole("link", { name: "Sign in to your account" })).toBeVisible();
  });

  test("the server's own messages appear next to the right field", async ({ page }) => {
    const person = unique();
    await signUp(page, person);
    await expect(page).toHaveURL(/\/account$/, { timeout: 10_000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await signUp(page, { ...person, email: person.email.toUpperCase() });
    await expect(page.getByText("An account with this email already exists. Please sign in instead.")).toBeVisible();

    await signIn(page, person, "Wrong1234");
    await expect(page.getByRole("alert").filter({ hasText: "The email or password is incorrect." })).toBeVisible();
    await signIn(page, { ...person, email: "nobody@example.com" });
    await expect(page.getByRole("alert").filter({ hasText: "The email or password is incorrect." })).toBeVisible();

    await signIn(page, person);
    await expect(page.getByRole("heading", { name: /Welcome back, Meera!/ })).toBeVisible();
  });

  test("email verification: the account page asks for it, the emailed link verifies it once, and a reused link says so", async ({ page }) => {
    const person = unique();
    await signUp(page, person);
    await expect(page.getByRole("heading", { name: "Welcome, Meera!" })).toBeVisible();
    await expect(page).toHaveURL(/:3100\/account$/, { timeout: 10_000 });
    const notice = page.getByRole("region", { name: "Email verification" });
    await expect(notice).toContainText(person.email);

    const token = await emailTo(person.email, /verify-email\?token=([\w-]+)/);
    await page.goto(`/verify-email?token=${token}`);
    await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
    await page.getByRole("link", { name: "Go to my account" }).click();
    await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Email verification" })).toHaveCount(0);

    await page.goto(`/verify-email?token=${token}`);
    await expect(page.getByRole("heading", { name: "This link did not work" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "invalid, has expired or was already used" })).toBeVisible();
  });

  test("a customer can ask for a new link, and the old one stops working", async ({ page }) => {
    const person = unique();
    await signUp(page, person);
    await expect(page).toHaveURL(/:3100\/account$/, { timeout: 10_000 });
    const first = await emailTo(person.email, /verify-email\?token=([\w-]+)/);
    await page.getByRole("button", { name: "Send a new link" }).click();
    await expect(page.getByText("We have sent a new verification link to your email.")).toBeVisible();
    await expect.poll(() => emailTo(person.email, /verify-email\?token=([\w-]+)/)).not.toBe(first);
    await page.goto(`/verify-email?token=${first}`);
    await expect(page.getByRole("heading", { name: "This link did not work" })).toBeVisible();
  });

  test("password reset end to end: the emailed code sets a new password and the old one stops working", async ({ page }) => {
    const person = unique();
    await signUp(page, person);
    await expect(page).toHaveURL(/:3100\/account$/, { timeout: 10_000 });
    await page.getByRole("button", { name: "Logout" }).click();

    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill(person.email);
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByRole("heading", { name: "Set a new password", level: 1 })).toBeVisible();
    const code = await emailTo(person.email, /Your code is (\d{6})/);

    await page.getByLabel("Code", { exact: true }).fill(code === "000000" ? "111111" : "000000");
    await page.getByLabel("New password", { exact: true }).fill("NewSaree2027");
    await page.getByLabel("Confirm new password", { exact: true }).fill("NewSaree2027");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByText("That code is not correct. Please check it and try again.")).toBeVisible();

    await page.getByLabel("Code", { exact: true }).fill(code);
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();

    await signIn(page, person);
    await expect(page.getByText("The email or password is incorrect.")).toBeVisible();
    await signIn(page, person, "NewSaree2027");
    await expect(page.getByRole("heading", { name: /Welcome back, Meera!/ })).toBeVisible();
  });

  test("checkout needs an account; addresses are saved on the server and stay private to the customer", async ({ page, browser }) => {
    const priya = unique("Priya Rao");
    await page.goto("/bag");
    await page.getByRole("link", { name: /Proceed to Checkout/ }).click();
    await expect(page).toHaveURL(/\/login\?next=\/checkout/);

    await signUp(page, priya, "/signup?next=/checkout");
    // wait for the welcome first: the sign-up page's own ?next=/checkout would also match a URL check
    await expect(page.getByRole("heading", { name: /^Welcome, / })).toBeVisible();
    await expect(page).toHaveURL(/:3100\/checkout$/, { timeout: 10_000 });
    await expect(page.getByText("No saved addresses yet")).toBeVisible();

    await page.getByRole("button", { name: /Add New Address/ }).click();
    await addAddress(page);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("12-3-45, Road No. 5, Banjara Hills, Hyderabad, Telangana - 500034")).toBeVisible();
    await expect(page.getByText("+91 9876543210")).toBeVisible();
    await expect(page.getByText("DEFAULT", { exact: true })).toHaveCount(1);

    // kept on the server: a reload, and even a fresh sign-in, show it again
    await page.reload();
    await expect(page.getByText("12-3-45, Road No. 5, Banjara Hills, Hyderabad, Telangana - 500034")).toBeVisible();
    await page.goto("/account");
    await page.getByRole("button", { name: "Logout" }).click();
    await signIn(page, priya);
    await expect(page.getByRole("heading", { name: /Welcome back, Priya!/ })).toBeVisible();
    await page.goto("/checkout");
    await expect(page.getByText("12-3-45, Road No. 5, Banjara Hills, Hyderabad, Telangana - 500034")).toBeVisible();

    // another customer, on another browser, sees none of it
    const otherContext = await browser.newContext({ baseURL: "http://localhost:3100" });
    const other = await otherContext.newPage();
    await signUp(other, unique("Ravi Sharma"), "/signup?next=/checkout");
    await expect(other.getByRole("heading", { name: /^Welcome, / })).toBeVisible();
    await expect(other).toHaveURL(/:3100\/checkout$/, { timeout: 10_000 });
    await expect(other.getByText("No saved addresses yet")).toBeVisible();
    await expect(other.getByText("Banjara Hills")).toHaveCount(0);
    await otherContext.close();

    // editing and deleting reach the server too
    await page.getByRole("button", { name: /Edit/ }).first().click();
    const edit = page.getByRole("dialog");
    await edit.getByLabel("City", { exact: true }).fill("Secunderabad");
    await edit.getByRole("button", { name: "Save Address" }).click();
    await expect(page.getByText(/Secunderabad, Telangana - 500034/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/Secunderabad, Telangana - 500034/)).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.reload();
    await expect(page.getByText("No saved addresses yet")).toBeVisible();
  });

  test("when the server refuses a save, the dialog says why and nothing is lost", async ({ page }) => {
    const person = unique();
    await signUp(page, person, "/signup?next=/checkout");
    await expect(page.getByRole("heading", { name: /^Welcome, / })).toBeVisible();
    await expect(page).toHaveURL(/:3100\/checkout$/, { timeout: 10_000 });

    // fill the address book to its limit of ten through the API, as the signed-in browser would
    const statuses = await page.evaluate(async (url) => {
      const results: number[] = [];
      for (let i = 0; i < 10; i++) {
        const response = await fetch(url + "/addresses", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "Home", label: "", name: "Priya Rao", phone: "9876543210", house: String(i + 1), street: "Road", city: "Hyderabad", state: "Telangana", pincode: "500034" }),
        });
        results.push(response.status);
      }
      return results;
    }, apiUrl);
    expect(statuses).toEqual(Array(10).fill(201));
    await page.reload();
    await page.getByRole("button", { name: /Add New Address/ }).click();
    await addAddress(page);
    await expect(page.getByRole("dialog").getByRole("alert").filter({ hasText: "You can save up to 10 addresses. Please delete one to add another." })).toBeVisible();
    await expect(page.getByRole("dialog").getByLabel("Street / Area / Landmark", { exact: true })).toHaveValue(address.street);
  });
});
