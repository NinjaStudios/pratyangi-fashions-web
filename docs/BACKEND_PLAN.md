# Backend plan

Read [ERP_INTEGRATION.md](ERP_INTEGRATION.md) first: it records what was verified in the ERP source and what is still unknown.

## Status by phase

| Phase | What | State |
| --- | --- | --- |
| 1. Inspect and plan | Repository and ERP read; findings and open questions written down | **Done** ([ERP_INTEGRATION.md](ERP_INTEGRATION.md)) |
| 2. Foundation | Express + TypeScript + Prisma + MySQL, `/api/v1`, env validation, logging, error handling, security middleware, migrations, tests | **Done, works locally** |
| 3. Authentication | Email/password, Google, server sessions, email verification link, password reset, logout, expiry, access control | **Done, works locally.** Google needs a client ID; emails need an email service (see "Needs outside configuration") |
| 4. Customer and commerce APIs | Saved addresses **done**. Products, cart, orders, order history: **not built** | Blocked on the ERP audit answers (section 2 of the ERP report) |
| 5. ERP integration | Adapter contract written ([`src/erp/port.ts`](../apps/api/src/erp/port.ts)), nothing connected | **Not started on purpose**: needs ERP team decisions |
| 6. Production readiness | Automated tests, security checks, backups, deployment, rollback, monitoring | Tests and security checks done; the rest needs a server |

### Works locally today
Sign up, sign in, sign out, Google sign-in (with a client ID), email verification link, forgot password, session expiry, saved delivery addresses (with an optional alternate number), per-field validation messages, rate limits, request logging. 41 API tests and 7 real browser-to-API tests pass against a real MySQL.

### Needs outside configuration (documented, not pretended)
| Needs | For | What happens without it |
| --- | --- | --- |
| Google OAuth client ID | "Continue with Google" | The Google route answers `503` and the button says it is not switched on |
| Email service (SMTP) credentials | Verification links and password-reset codes | Development prints the email to the API console. Production: signup still works, `verificationEmailSent` is `false`, "Send a new link" and password reset answer `503` with a clear message |
| A server and a database host | Going live | Accounts are real only on a developer machine; the live site says "Accounts are not connected yet" |
| SMS provider | Mobile OTP | **Not built.** Add only if a business requirement justifies the cost (India's DLT registration is required before any OTP SMS is delivered) |

### Depends on the PHP ERP (not built)
Products, categories, prices, stock, order creation, order status, returns and refunds. See the source-of-truth table in the ERP report. No endpoint is invented: `order_create.php` is the only ERP API that exists for the website (it creates an order and reserves stock); a catalogue, availability and order-status read API must be added or agreed.

## Stack

- Node.js 24 (current LTS line), Express 5, TypeScript (`apps/api`, package `pratyangi-api`)
- MySQL 8 through **Prisma 6** (`prisma/schema.prisma`; versioned migrations in `prisma/migrations`; `pnpm api:migrate` applies them). Prisma 6 was chosen over the newer major because its MySQL support is stable and it needs no driver adapter
- Zod for every request; `@node-rs/argon2` (Argon2id) for passwords; `google-auth-library` to check Google tokens
- Helmet, a CORS allow-list, an Origin check on every change (CSRF), `express-rate-limit`, and `pino` structured logging with cookies, authorization headers and bodies never logged
- Tests: Vitest + Supertest against a real MySQL test database; Playwright drives the real website against the real API (`pnpm --filter pratyangi-web test:e2e:api`)
- All routes are under `/api/v1`; `/health` is also available at the root for load balancers

Setup and commands: [apps/api/README.md](../apps/api/README.md). Settings: `apps/api/.env.example`.

## Data model (this API owns only the customer)

`shop_customers` (name, unique lower-case email, optional password hash, `email_verified_at`, picture), `shop_customer_identities` (Google), `shop_sessions` (token hash only), `shop_customer_addresses` (recipient, delivery mobile, optional alternate mobile, house, street, city, state, PIN, default flag), `shop_password_resets`, `shop_email_verifications` (token hash only).

There is no product, stock or order table: the ERP owns them. There is **no phone number on the customer**: delivery mobiles belong to addresses, and mobile verification status therefore does not exist yet, so it can never be mixed up with email verification.

Database rules: the connection is one setting (`DATABASE_URL`); every query goes through Prisma with parameters; UTC dates; every schema change is a new migration, never an edit to one that ran; no destructive migration without a written reason. `UNIQUE (email)` guarantees one account per email even when two requests race.

## Authentication behaviour

- Email + password signup (name, email, password). Passwords are Argon2id hashes; email stored lower-case.
- **Email verification:** signup emails a link (`/verify-email?token=...`, 24 hours, single use, only a hash of the token stored). The account works before verifying (nothing in checkout requires it yet); the account page shows a notice with "Send a new link". Verification status is independent of any mobile number.
- **Google:** the website sends Google's ID token; the API checks signature, expiry, issuer and that it was issued for our client ID, and requires `email_verified`. A first-time Google user gets an account; a returning one gets the same account (matched by Google's user id, then by verified email).
- **Account linking is never based on an unverified email.** Google's email is verified. If a *password* account with that email exists whose email was never verified, linking proceeds only after discarding that unproven password and ending its sessions (blocks the pre-registration takeover). If the existing account's email is verified, Google links to it. A Google-only account cannot be taken over by email signup.
- **Sessions:** a random 256-bit token in an `httpOnly`, `SameSite=Lax`, `Secure` (production) cookie; the database stores only its SHA-256. Expiry is `SESSION_DAYS` (default 30). Logout deletes the session on the server. A password reset or change ends every session.
- **Password reset:** 6-digit code by email, hashed, 10 minutes, 5 wrong tries, single use. Without an email service production answers `503`.
- Login errors are neutral and take the same time for an unknown email and a wrong password.
- Server-side authorization: every `/addresses` route requires a session and scopes each query to the signed-in customer.

## API contract (all under `/api/v1`)

All requests are JSON with `credentials: "include"`. Failures are `{ message, field?, errors? }`; validation failures are `422` with one message per field in `errors`.

| Method and path | Body | Success | Failure |
| --- | --- | --- | --- |
| `POST /auth/signup` | `{ name, email, password }` | `201 { user, verificationEmailSent }` + cookie | `422` per-field; `409` email already used (`field: "email"`) |
| `POST /auth/login` | `{ email, password }` | `200 { user }` + cookie | `422`; `401` neutral message; `429` |
| `POST /auth/google` | `{ credential }` | `200 { user }` + cookie | `401` invalid or unverified; `503` not configured |
| `POST /auth/logout` | none | `204`, cookie cleared | none |
| `GET /auth/me` | none | `200 { user }` | `401` |
| `POST /auth/email/verify` | `{ token }` | `200 { customer }` | `400` invalid, expired or used (`field: "token"`); `422` incomplete link |
| `POST /auth/email/resend` | none (signed in) | `200 { message }` | `401`; `503` no email service; `429` |
| `POST /auth/password/forgot` | `{ email }` | `200 { message }`, always the same | `503` no email service; `429` |
| `POST /auth/password/reset` | `{ email, code, password }` | `204`; all sessions end | `400` wrong/expired code (`field: "code"`); `422` weak password |
| `GET /addresses` | none | `200 { addresses }` | `401` |
| `POST /addresses` | address | `201 { address }` | `422` per-field; limit of 10 |
| `PUT /addresses/:id` | address | `200 { address }` | `422`; `404` not yours or gone |
| `DELETE /addresses/:id` | none | `204` | `404` |
| `POST /addresses/:id/default` | none | `200 { addresses }` | `404` |

`user` is `{ id, name, email, provider: "password" | "google", emailVerified, picture? }`. An address is `{ id, type, label, isDefault, name, phone, alternatePhone?, house, street, city, state, pincode }`.
Guest checkout is not implemented: the current storefront flow requires sign-in, and a guest flow needs the order model, so it is decided with Phase 4.

## Hosting and budget (nothing is bought)

Target for backend host plus database: about ₹3,000 to ₹5,000 per month. **No prices below were checked today; confirm current plans, GST and renewal rates before choosing.**

**The BigRock plan:** reported as Pro Classic 2025 multi-domain Linux shared hosting at roughly ₹896 per month. Its control panel shows PHP, Perl and phpMyAdmin tools but no Node.js option, so it **very probably cannot run this API; confirm with BigRock support before assuming either way**. It also hosts many unrelated sites under one account, so customer data should not share it.

| Option | Fits the budget? | Notes |
| --- | --- | --- |
| Small VPS (BigRock or another Indian provider) running Node, Nginx and MySQL on one machine | Very likely well inside it | Cheapest. You own updates, firewall, backups and monitoring. Needs root access (confirm it is offered) |
| Managed Node app host plus a managed MySQL database (from a cloud provider; several offer small tiers) | Probably inside it for a small store; check the database tier price | No server upkeep; automatic HTTPS and deploys; backups usually built in |
| Managed MySQL only, with the API on a small VPS | Probably | Splits the risk: the database gets managed backups |
| Vercel for the API | Not suitable | Serverless functions do not suit a long-lived MySQL connection pool and local rate-limit state; keep Vercel for the website |

Requirements for any option: HTTPS everywhere; MySQL **never** open to the public internet (private network or localhost only, firewall: 22, 80, 443 only, SSH by key); the API on a sub-domain of the website's own domain (`api.pratyangifashions.com`) so the sign-in cookie is same-site; logs shipped or rotated; secrets only in environment variables.

## Production readiness (to do when a host is chosen)

- [ ] Deploy `apps/api` (`pnpm --filter pratyangi-api build` then `start`) under PM2 or systemd, or the managed host's runner; `NODE_ENV=production`, `TRUST_PROXY=1`
- [ ] Run `pnpm api:migrate` (migrations are additive; take a backup first)
- [ ] Daily database backups copied off the server, **and a restore tested on a spare database before launch**
- [ ] Least-privilege MySQL user (no `DROP` or `CREATE` outside migrations); migrations run with a separate admin user
- [ ] Uptime check on `/api/v1/health`; error alerts; log retention
- [ ] Rollback: keep the previous build; migrations are forward-only, so a rollback restores the backup taken before migrating
- [ ] DPDP Act review of customer-data duties; privacy policy and terms pages (the signup page links to text that does not exist yet)
- [ ] Email domain set up for sending (SPF, DKIM, DMARC) so verification and reset emails reach the inbox

## Security checklist (status)

- [x] Argon2id passwords; never stored or logged in plain text
- [x] Parameterised queries only (Prisma); every request validated with Zod; error replies never include SQL, paths or stack traces
- [x] Session cookie `httpOnly`, `SameSite=Lax`, `Secure` in production; only a hash of the token stored
- [x] CSRF: SameSite plus an Origin allow-list check on every POST, PUT and DELETE
- [x] CORS allow-list with credentials; Helmet headers; 20 KB request limit; rate limits on login, signup, Google, verification and reset
- [x] No secrets in the website (the Google client ID is public; no client secret is used); secrets only in `apps/api/.env`, ignored by git
- [x] Logs redact cookies and authorization headers and never contain bodies
- [x] Concurrency: unique keys and row locks, tested (simultaneous signups, simultaneous address saves)
- [ ] HTTPS, firewall, least-privilege DB user, backups, monitoring: when the server exists
- [ ] Order and payment security (server-side pricing, idempotent order creation, verified payment webhooks): designed with Phase 4

## AI Try-On (future, not started)

Design intent only, no provider chosen and no cost incurred. When approved: the provider key lives only on the API; uploads accepted only as JPEG/PNG/WebP up to a fixed size, type-checked by content, never trusted by extension; per-customer daily limits and a global monthly spend cap (the API refuses when the cap is hit); explicit consent before any photo is uploaded; photos stored privately (not public URLs), deleted within a stated period (for example 24 hours) and on request; nothing is sent to a provider that was not approved in writing. A `shop_tryon_jobs` table (customer, status, created, deleted_at) will back the limits and deletion.

## Settings

API (`apps/api/.env`, see `.env.example`): `DATABASE_URL`, `WEB_ORIGIN`, `PORT`, `SESSION_DAYS`, `TRUST_PROXY`, `LOG_LEVEL`, `GOOGLE_CLIENT_ID`, `SMTP_URL`, `MAIL_FROM`.
Website (`apps/web/.env.local`, see `.env.example`): `NEXT_PUBLIC_API_URL` (the API address, without `/api/v1`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_AUTH_DEMO` (review-only stand-in; never on the live site).

### Sign in with Google (one-time setup, by the account owner)

1. Open https://console.cloud.google.com, create (or pick) a project for Pratyangi Fashions.
2. "APIs & Services" → "OAuth consent screen": choose External, fill the app name, support email and logo, add your domain, publish.
3. "Credentials" → "Create credentials" → "OAuth client ID" → type "Web application".
4. Under "Authorised JavaScript origins" add `http://localhost:3000` (testing) and the live website address(es). No redirect URI is needed.
5. Copy the client ID (ends in `.apps.googleusercontent.com`) into `apps/web/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (and on Vercel
   under Project → Settings → Environment Variables), and into `apps/api/.env` as `GOOGLE_CLIENT_ID`.
