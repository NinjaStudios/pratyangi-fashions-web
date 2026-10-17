import mysql from "mysql2/promise";
import type { Pool, PoolConnection } from "mysql2/promise";
import type { Config } from "./config.js";

export type Db = Pool;

export function createPool(config: Config, options: { multipleStatements?: boolean } = {}): Db {
  return mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    // dates are written and read as UTC, so sessions expire at the same moment whatever the server's time zone
    timezone: "Z",
    // every value goes in as a parameter (`?`), never by joining strings
    multipleStatements: options.multipleStatements ?? false,
  });
}

/** Runs `work` inside one transaction: everything inside it happens, or none of it does. */
export async function inTransaction<T>(db: Db, work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
