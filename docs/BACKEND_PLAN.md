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
