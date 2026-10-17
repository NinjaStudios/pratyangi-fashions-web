import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { createPool, type Db } from "./db.js";

const sqlDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "sql");

/** Applies every numbered script in apps/api/sql that has not run yet, in order, and remembers which ones ran. */
export async function migrate(db: Db, log: (message: string) => void = console.log): Promise<string[]> {
  await db.query(`CREATE TABLE IF NOT EXISTS shop_schema_migrations (
    name VARCHAR(190) PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const [rows] = await db.query("SELECT name FROM shop_schema_migrations");
  const done = new Set((rows as { name: string }[]).map((row) => row.name));
  const files = (await readdir(sqlDir)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    log(`applying ${file}`);
    await db.query(await readFile(path.join(sqlDir, file), "utf8"));
    await db.query("INSERT INTO shop_schema_migrations (name) VALUES (?)", [file]);
    applied.push(file);
  }
  if (!applied.length) log("database is up to date");
  return applied;
}

// `pnpm --filter pratyangi-api migrate`
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const db = createPool(loadConfig(), { multipleStatements: true });
  migrate(db)
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => db.end());
}
