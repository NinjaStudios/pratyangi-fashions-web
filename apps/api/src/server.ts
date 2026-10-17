import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDb } from "./db.js";
import { createMailer } from "./mailer.js";

const config = loadConfig();
const db = createDb(config);
const app = createApp({ config, db, mailer: createMailer(config) });

// fail fast if the database cannot be reached (or migrations were not applied), instead of answering every request with an error
await db.customer.count();

const server = app.listen(config.PORT, () => {
  console.log(`Pratyangi API listening on http://localhost:${config.PORT}/api/v1 (${config.NODE_ENV})`);
  if (!config.GOOGLE_CLIENT_ID) console.log("  Google sign-in: not configured (set GOOGLE_CLIENT_ID)");
  if (!config.SMTP_URL) console.log(`  Email: ${config.isProduction ? "NOT configured, verification and password reset emails are off (set SMTP_URL)" : "no SMTP_URL, emails are printed here"}`);
});

const stop = () => server.close(() => db.$disconnect().then(() => process.exit(0)));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
