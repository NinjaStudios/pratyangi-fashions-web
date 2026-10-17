import { Prisma, PrismaClient } from "@prisma/client";
import type { Config } from "./config.js";

export type Db = PrismaClient;
export type Tx = Prisma.TransactionClient;

/** One Prisma client (with its connection pool) for the whole process. Every query goes through it, with parameters, never string-joined SQL. */
export function createDb(config: Config): Db {
  return new PrismaClient({ datasources: { db: { url: config.DATABASE_URL } }, log: ["warn", "error"] });
}

/** True when a write failed because a UNIQUE key (e.g. one account per email) already has that value. */
export const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
