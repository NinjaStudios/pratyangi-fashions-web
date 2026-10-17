# Backend plan

Status: **planned, not started.** This phase begins after the frontend UI is signed off.

## Stack

- Node.js (current LTS) with Express, written in TypeScript
- MySQL 8 using the `mysql2` driver (promise API, connection pool)
- Plain numbered SQL upgrade scripts, applied in order by a small runner
- Zod for validating incoming requests
- Runs on a Linux VPS: Nginx in front, the API under PM2 or systemd, MySQL on the same server at first

The API will live in `apps/api` next to the storefront in `apps/web`.

## Why not the existing shared hosting

The current BigRock plan is shared Linux hosting with cPanel. Its control panel shows PHP, Perl, WordPress and phpMyAdmin
tools but no option to run a Node.js application, so Express cannot run there. It also hosts roughly forty domains and
subdomains for other live systems under one account, which share a single system user. A weakness in any one of those sites could expose the
others' files and database passwords, so orders, customer details and payment-related data should live on a separate server.

The shared plan is still fine for serving static files if ever needed.

## Hosting options

| Option | Notes |
| --- | --- |
| BigRock self-managed VPS | Same vendor as the domain; BigRock's public page lists small plans from about ₹289 to ₹349 per month (check current price, GST and renewal price). Needs root access and the ability to install Node, Nginx and MySQL — confirm before buying |
| BigRock managed VPS | BigRock handles server upkeep; costs more |
| Another VPS provider | Fine if the owner prefers; the setup is the same |

You manage a self-managed VPS: operating-system updates, firewall, backups and monitoring. If nobody on the team wants that,
choose a managed option.

## Database rules (keep it portable)

1. The database connection comes from one setting, `DATABASE_URL`, never hard-coded.
2. All SQL lives in one data layer (repository files). The rest of the code never writes SQL.
3. Use standard column types; store money as integers in paise; use `utf8mb4`.
4. Avoid MySQL-only features unless there is a clear reason, so a later move to another database stays possible.
5. Every schema change is a new numbered file, never an edit to an old one:

```
apps/api/sql/
  0001_create_users.sql
  0002_create_products.sql
  0003_create_orders.sql
```

A small runner applies unapplied files in order and records each one (with a checksum) in a `schema_migrations` table.
Keep each script small, because MySQL cannot roll back most schema changes.

## Security checklist

- HTTPS everywhere (Let's Encrypt, auto-renewing)
- Firewall: only ports 22, 80 and 443 open; SSH by key only; consider fail2ban
- MySQL listens on localhost only; the API uses a least-privilege database user, not root
- Parameterised queries only (`mysql2` prepared statements); validate every request with Zod
- Passwords hashed with Argon2 or bcrypt; never stored or logged in plain text
- Cookies: `httpOnly`, `Secure`, `SameSite`; CSRF protection on state-changing routes
- Rate limiting on sign-in and checkout; Helmet for security headers; CORS allow-list
- Secrets only in environment variables on the server, never in the repository
- Payments through a hosted gateway such as Razorpay; verify webhook signatures; calculate prices on the server;
  never touch card numbers
- Daily database backups copied off the server, and a restore tested before launch
- Regular operating-system and dependency updates; uptime monitoring and error logs
- Review data-protection duties for customer data (India's DPDP Act) before launch

## First steps when this phase starts

1. Confirm the hosting choice and get root access to the server.
2. Create `apps/api` with Express, a `/health` route and the SQL runner.
3. Add users, products and orders tables, then connect the storefront's bag and account pages to the API.
4. Add payments last, behind a hosted gateway, in a test mode first.
5. Turn on backups and monitoring before any real customer data is stored.

## Accounts and sign-in (what the website already expects)

The sign-in and sign-up pages (`/login`, `/signup`) are finished on the website side. Until the API exists they run on an
in-browser **demo** (accounts kept only in that browser). Setting `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` switches the
site to the real API with no other code change: `apps/web/src/lib/auth/` has one interface (`AuthClient`) with a demo and an API
implementation.

### API contract the website calls

All requests send JSON and use `credentials: "include"`, so the session lives in an `httpOnly`, `Secure`, `SameSite` cookie set by
the server (the website never stores a token).

| Method and path | Body | Success | Failure (JSON `{ message, field? }`) |
| --- | --- | --- | --- |
| `POST /auth/otp/send` | `{ phone }` (10 digits) | `200 { isNew }`; an SMS with a 6-digit code goes to the number | `422` invalid number (`field: "phone"`), `429` too many requests |
| `POST /auth/otp/verify` | `{ phone, code, name? }` | `200 { user }` and session cookie; the account is created when `isNew` | `401` wrong or expired code (`field: "code"`), `422` name missing for a new number (`field: "name"`), `429` too many attempts |
| `POST /auth/google` | `{ credential }` (Google ID token) | `200 { user }` and session cookie | `401` token invalid |
| `POST /auth/logout` | none | `204` and cookie cleared | none |
| `GET /auth/me` | none | `200 { user }` | `401` when signed out |

`user` is `{ id, name, phone?, email?, provider: "phone" | "google", picture? }`.

OTP rules: a random 6-digit code per request, stored hashed, valid for about 5 minutes, single use; allow 5 wrong attempts per
code and a few sends per number per hour; a new code replaces the old one. The SMS goes through an Indian provider (MSG91,
Twilio Verify or similar). India's TRAI rules require the sender ID and message template to be registered (DLT) before any OTP
SMS is delivered, so the client should start that registration early. Keep the demo code (`123456`) out of the real server.

Server rules: validate every field again with Zod (the browser checks are only for convenience); rate-limit the OTP and Google routes; CORS allows only the website's
address; CSRF protection on every state-changing route. For Google: verify the ID token with Google's library
(`google-auth-library`, `verifyIdToken` with your client ID as the audience), accept only `email_verified: true`, and link by email.

### Sign in with Google (one-time setup, by the account owner)

1. Open https://console.cloud.google.com, create (or pick) a project for Pratyangi Fashions.
2. "APIs & Services" → "OAuth consent screen": choose External, fill the app name, support email and logo, add your domain, publish.
3. "Credentials" → "Create credentials" → "OAuth client ID" → type "Web application".
4. Under "Authorised JavaScript origins" add `http://localhost:3000` (for testing) and the live website address
   (for example `https://pratyangi-fashions-web.vercel.app` and the final domain). No redirect URI is needed for this button.
5. Copy the client ID (ends in `.apps.googleusercontent.com`) into `apps/web/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and on
   Vercel under Project → Settings → Environment Variables. The same client ID goes into the API's settings for token checks.

Until a client ID is set the Google button is shown and explains it is not switched on yet. With an ID set, Google draws its
official button, and in demo mode the site signs the visitor in from the (unverified) token, only for local review.
