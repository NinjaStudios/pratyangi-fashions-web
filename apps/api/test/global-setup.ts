import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

/** Before any test: apply the Prisma migrations to the test database, exactly as a real deployment would. */
export default function setup() {
  dotenv.config({ path: ".env.test", override: true });
  const url = process.env.DATABASE_URL ?? "";
  if (!new URL(url).pathname.slice(1).endsWith("_test")) throw new Error("Refusing to migrate: DATABASE_URL must point at a database whose name ends in _test.");
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { env: process.env, encoding: "utf8", shell: true });
  if (result.status !== 0) throw new Error(`prisma migrate deploy failed:\n${result.stdout}\n${result.stderr}`);
}
