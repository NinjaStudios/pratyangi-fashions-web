# Backend plan

Status: **foundation built and tested locally** (`apps/api`): customer accounts (email + password, Google), server-side sessions
and the customer's saved delivery addresses. Products, stock and orders are **not** in this API: they stay in the existing PHP ERP
(see "Source of truth"). Nothing is deployed yet; there is no server to host it on (see "Hosting").

## Stack

- Node.js 24 with Express 5, written in TypeScript (`apps/api`, package `pratyangi-api`)
- MySQL 8 through `mysql2` (promise API, pool, parameterised queries only)
- Zod for validating every request; `@node-rs/argon2` (Argon2id) for passwords; `google-auth-library` to check Google tokens
- Helmet, CORS allow-list, an Origin check on every change (CSRF), and `express-rate-limit` on the sensitive routes
- Plain numbered SQL scripts in `apps/api/sql`, applied in order by `pnpm api:migrate` and remembered in `shop_schema_migrations`
- Tests: Vitest + Supertest against a real MySQL test database (29 tests), plus Playwright end-to-end tests that drive the real
  website against the real API (`pnpm --filter pratyangi-web test:e2e:api`)

Setup and commands are in [apps/api/README.md](../apps/api/README.md).

## Source of truth (so nothing is duplicated)

The existing ERP (`Pratyangi_Backend_Portal/app`, PHP + MySQL, left unchanged) already owns the business data:
`products`, `categories`, `inventory_balances`, `stock_ledger`, `sales`, `online_orders`, `online_order_items`,
`customers`, `customer_ledger`. The website must not keep its own copy of any of it.

| Data | Owner | How the website gets it |
| --- | --- | --- |
| Website customer login, sessions, saved addresses | **Shop API** (`shop_*` tables, this repo) | Directly |
| Products, prices, stock | **ERP** | Read through an ERP API or a read-only database view, after the ERP audit. Never copied into `shop_*` |
| Online orders and their stock | **ERP** (`online_orders`, `inventory_balances`) | The shop API will create an order in the ERP and keep only `customer_id` and a reference. The delivery address is copied onto the order at that moment (a snapshot), so later address edits never change old orders |
| ERP `customers` (POS customers and ledger) | **ERP** | `shop_customers` is the website login and stays separate. After the audit, an optional `erp_customer_id` column can link the two by a verified email or phone. They are not merged now |

Every shop table starts with `shop_`, so it can sit in the same MySQL database as the ERP without touching an ERP table.

**ERP audit still to do** (blocker for products and orders, not for accounts): read the ERP's schema and PHP to decide how products
and stock are read, how an online order is created, whether the ERP has an API or needs a thin one added, and how the ERP's
`customers` should be linked.

## Hosting (we do not assume a VPS)

Develop locally first (done). The BigRock **shared** plan cannot run a Node.js app: its panel offers PHP, Perl and phpMyAdmin
but no Node option, and it hosts many unrelated sites under one account. So before the API can go live, one of these is needed:

| Option | Notes |
| --- | --- |
| A small VPS (BigRock or any provider) | Cheapest full option. Needs root access to install Node, Nginx and MySQL. You manage updates, firewall and backups |
| A managed Node host plus a managed MySQL | No server upkeep; costs more |
| Rewrite the API in PHP for the shared plan | Possible, but means throwing away `apps/api`; not recommended |

**Cookie rule for the live site:** put the API on a sub-domain of the website's own domain (website `www.pratyangifashions.com`,
API `api.pratyangifashions.com`). The sign-in cookie is then "same site" and the browser sends it. An API on an unrelated domain,
or the `*.vercel.app` preview links, will not keep people signed in.

## Database rules (keep it portable)

1. The connection comes from settings (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), never hard-coded.
2. Every query uses `?` parameters; values are never joined into SQL text.
3. Standard column types, `utf8mb4`, UTC dates.
4. Every schema change is a new numbered file (`002_...sql`), never an edit to one that has run.
5. `UNIQUE (email)` on `shop_customers` is what guarantees one account per email, whatever the sign-in method, even if two requests race.

## What is built

### Accounts and sessions

- Email + password signup (name, email, password) and login. Passwords are Argon2id hashes. Email is stored lower-case.
- "Continue with Google": the website sends the Google ID token; the API checks signature, expiry, issuer and that it was issued for **our** client ID, and requires a verified Google email.
- First-time Google users get an account automatically; returning users get the same account (matched by Google's user id, then by the verified email), so one email never becomes two accounts.
- If an email was registered with a password that nobody ever proved (no email verification yet) and the real owner then signs in with Google, the unproven password is deleted and its sessions end. This blocks the "pre-registered account" takeover.
- A Google-only account cannot be taken over by email signup; the form says "already registered through Google".
- Sessions are server-side: a random 256-bit token in an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie; the database keeps only its SHA-256 hash. Logout deletes it on the server. Changing a password ends every session.
- Forgot password: a 6-digit code by email (stored hashed, 10 minutes, 5 wrong tries, single use). Without an email service in production the route answers `503` honestly instead of pretending.
- Login errors are neutral (the same message for an unknown email and a wrong password, same timing).

### Delivery addresses

- A signed-in customer can list, add, edit, delete and set a default address (maximum 10). Every query is scoped to the signed-in customer, so nobody can read or change another customer's address (tests prove it).
- Recipient name, **delivery mobile**, house, street, city, state and PIN code are validated on the server with clear messages. The delivery mobile is a separate field on each address; the account has no phone number at all, so it can never be confused with the login. No OTP is needed at checkout.

### API contract the website calls

All requests are JSON with `credentials: "include"`. Failures are `{ message, field?, errors? }`; validation failures are `422` with one message per field in `errors`.

| Method and path | Body | Success | Failure |
| --- | --- | --- | --- |
| `POST /auth/signup` | `{ name, email, password }` | `201 { user }` + cookie | `422` per-field messages; `409` email already used (`field: "email"`, says whether it was password or Google) |
| `POST /auth/login` | `{ email, password }` | `200 { user }` + cookie | `422`; `401` "The email or password is incorrect." (or "signs in with Google"); `429` |
| `POST /auth/google` | `{ credential }` | `200 { user }` + cookie | `401` token invalid or email unverified; `503` Google not configured |
| `POST /auth/logout` | none | `204`, cookie cleared | none |
| `GET /auth/me` | none | `200 { user }` | `401` |
| `POST /auth/password/forgot` | `{ email }` | `200 { message }`, always the same | `503` no email service; `429` |
| `POST /auth/password/reset` | `{ email, code, password }` | `204`; all sessions end | `400` wrong/expired code (`field: "code"`); `422` weak password |
| `GET /addresses` | none | `200 { addresses }` | `401` |
| `POST /addresses` | address | `201 { address }` | `422` per-field; limit of 10 |
| `PUT /addresses/:id` | address | `200 { address }` | `422`; `404` not yours or gone |
| `DELETE /addresses/:id` | none | `204` | `404` |
| `POST /addresses/:id/default` | none | `200 { addresses }` | `404` |

`user` is `{ id, name, email, provider: "password" | "google", picture? }`. An address is `{ id, type, label, isDefault, name, phone, house, street, city, state, pincode }`.

## Security checklist (status)

- [x] Passwords: Argon2id, never stored or logged in plain text
- [x] Parameterised SQL only; every request validated with Zod; error messages never include SQL or stack traces
- [x] Session cookie `httpOnly`, `SameSite=Lax`, `Secure` in production; only a hash of the token is stored
- [x] CSRF: SameSite plus an Origin allow-list check on every POST, PUT and DELETE
- [x] CORS allow-list with credentials; Helmet headers; 20 KB request limit
- [x] Rate limits on login, signup, Google and password reset
- [x] No secrets in the website: the Google client ID is public and there is no client secret in this flow
- [x] Secrets only in environment variables (`apps/api/.env`, ignored by git)
- [ ] HTTPS, firewall, a least-privilege MySQL user (not root), backups and monitoring: **when the server exists**
- [ ] Email verification at signup (needs an email service). Until then `email_verified` is only `1` for Google or a reset code
- [ ] DPDP Act review of customer-data duties before launch

## Settings the API needs (`apps/api/.env`, see `.env.example`)

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | everything | MySQL 8. Use a dedicated least-privilege user |
| `WEB_ORIGIN` | everything | The website address(es). Only these may call the API with cookies |
| `PORT`, `SESSION_DAYS`, `TRUST_PROXY` | optional | Defaults 4000, 30, 0. Set `TRUST_PROXY=1` behind a reverse proxy |
| `GOOGLE_CLIENT_ID` | Google sign-in | Same client ID as the website's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Empty: the route answers `503` |
| `SMTP_URL`, `MAIL_FROM` | password-reset email | Empty in development prints the code to the API console; empty in production turns reset off |

The website (`apps/web/.env.local`, see `.env.example`): `NEXT_PUBLIC_API_URL` (the API address), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and
`NEXT_PUBLIC_AUTH_DEMO` (review-only stand-in; never on the live site).

### Sign in with Google (one-time setup, by the account owner)

1. Open https://console.cloud.google.com, create (or pick) a project for Pratyangi Fashions.
2. "APIs & Services" → "OAuth consent screen": choose External, fill the app name, support email and logo, add your domain, publish.
3. "Credentials" → "Create credentials" → "OAuth client ID" → type "Web application".
4. Under "Authorised JavaScript origins" add `http://localhost:3000` (testing) and the live website address(es). No redirect URI is needed.
5. Copy the client ID (ends in `.apps.googleusercontent.com`) into `apps/web/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (and on Vercel
   under Project → Settings → Environment Variables), and into `apps/api/.env` as `GOOGLE_CLIENT_ID`.

## Blockers and decisions still open

1. **A server to host the API** (see Hosting). Until then accounts are real only on a developer's machine, so the live site shows "Accounts are not connected yet" (or the review-only demo if switched on).
2. **ERP audit** before products, stock and orders: how to read them, how to create an online order in the ERP, whether to add an API to the ERP.
3. **Google OAuth client ID** (steps above) and an **email service** (Resend, Amazon SES, Brevo...) with SPF/DKIM on the domain.
4. **Payments** (Razorpay or similar) come after orders, behind the hosted gateway, in test mode first.
5. **Order and payment security** (server-side price calculation, webhook signature checks) is designed when orders are built.

## Next steps

1. Pick the host and deploy `apps/api` behind HTTPS on an `api.` sub-domain; set the live environment variables; run `pnpm api:migrate`.
2. Set `NEXT_PUBLIC_API_URL` on Vercel; remove any `NEXT_PUBLIC_AUTH_DEMO`.
3. Audit the ERP; then products (read-only), bag, orders (created in the ERP) and the account's order history.
4. Payments, then AI try-on (server holds the key).
