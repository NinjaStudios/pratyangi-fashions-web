import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createPool } from "./db.js";
import { createMailer } from "./mailer.js";

const config = loadConfig();
const db = createPool(config);
const app = createApp({ config, db, mailer: createMailer(config) });

// fail fast if the database cannot be reached, instead of answering every request with an error
await db.query("SELECT 1");

const server = app.listen(config.PORT, () => {
  console.log(`Pratyangi API listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
  if (!config.GOOGLE_CLIENT_ID) console.log("  Google sign-in: not configured (set GOOGLE_CLIENT_ID)");
  if (!config.SMTP_URL) console.log(`  Email: ${config.isProduction ? "NOT configured, password reset is off (set SMTP_URL)" : "no SMTP_URL, codes are printed here"}`);
});

const stop = () => server.close(() => db.end().then(() => process.exit(0)));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
