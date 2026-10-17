# Pratyangi store API

Express 5 + TypeScript + Prisma + MySQL 8. Customer accounts (email/password and Google), server-side sessions, email
verification, password reset and saved delivery addresses for the storefront in `apps/web`. Routes are under `/api/v1`.

The plan, API contract and security notes: [docs/BACKEND_PLAN.md](../../docs/BACKEND_PLAN.md).
What is verified about the ERP and what is not: [docs/ERP_INTEGRATION.md](../../docs/ERP_INTEGRATION.md).
Products, stock and orders are **not** here: they stay in the PHP ERP.

## Run it on your machine

You need Node 24, pnpm (`npx pnpm@10 ...` works), and a MySQL 8 server you can create a database on.

```bash
# 1. Create the databases and a user (in the MySQL shell, as an admin). Use your own password.
CREATE DATABASE pratyangi_shop CHARACTER SET utf8mb4;
CREATE DATABASE pratyangi_shop_test CHARACTER SET utf8mb4;
CREATE USER 'pratyangi'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL ON pratyangi_shop.* TO 'pratyangi'@'localhost';
GRANT ALL ON pratyangi_shop_test.* TO 'pratyangi'@'localhost';

# 2. Settings (from the repo root)
cd apps/api
cp .env.example .env              # set DATABASE_URL (URL-encode special characters in the password)
cp .env.test.example .env.test    # same, pointing at the _test database

# 3. Create the tables, then start
pnpm api:migrate                  # from the repo root: applies prisma/migrations
pnpm api:dev                      # http://localhost:4000/api/v1, restarts on changes
```

Point the website at it: in `apps/web/.env.local` set `NEXT_PUBLIC_API_URL=http://localhost:4000`, then `pnpm dev`. Sign up, verify
your email, sign in, add an address at checkout: all of it goes through this API and MySQL. With no `SMTP_URL`, each email
(verification link, reset code) is printed in the API's console.

The tables are all named `shop_*`, so they can live in the same MySQL database as the ERP without touching the ERP's tables.

## Changing the database

Edit `prisma/schema.prisma`, then `pnpm api:migrate:dev -- --name what_changed` (needs a user that may create a temporary "shadow"
database). That writes a new numbered folder in `prisma/migrations`; commit it. Never edit a migration that has already run. On a
server only `pnpm api:migrate` is used (it applies pending migrations and never resets anything).

## Tests

```bash
pnpm api:test        # 41 tests against the _test database
pnpm api:typecheck
```

The tests apply the migrations to the `_test` database themselves and then EMPTY its tables, and they refuse to run unless the
database name ends in `_test`.

Real end to end (the website in Chrome talking to this API and MySQL, reading the verification link and reset code from the API's
console log): put `DATABASE_URL` for a migrated `_test` database in the shell, then `pnpm --filter pratyangi-web test:e2e:api`.

## Layout

```
prisma/schema.prisma      the tables (shop_customers, shop_sessions, shop_customer_addresses, ...)
prisma/migrations/        versioned SQL, applied in order
src/config.ts             reads and checks the environment once, at start-up
src/db.ts                 Prisma client
src/validation.ts         every input rule, with the message the customer sees
src/auth/                 signup, login, Google, email verification, reset; sessions; Google token check
src/addresses/            address book (every query scoped to the signed-in customer)
src/erp/port.ts           the contract for talking to the ERP later (nothing connected)
src/app.ts                routes, CORS, CSRF origin check, rate limits, logging, error handler
src/server.ts             start-up
test/                     Vitest + Supertest against real MySQL
```

## Going live (not done, needs a server)

See "Hosting and budget" and "Production readiness" in the plan. In short: HTTPS behind Nginx or the host's proxy on an `api.`
sub-domain of the website's domain, `NODE_ENV=production`, `TRUST_PROXY=1`, `WEB_ORIGIN` set to the live website, a least-privilege MySQL
user, `GOOGLE_CLIENT_ID` and `SMTP_URL` set, `pnpm api:migrate`, then `pnpm --filter pratyangi-api build` and `start`. Back up the
database daily and test a restore.
