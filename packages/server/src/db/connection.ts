import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { resolve } from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const DB_PATH = process.env.DB_PATH ?? "bignight.db";

const MIGRATIONS_DIR = resolve(fileURLToPath(import.meta.url), "../../..", "drizzle");

export function createDb(path: string = DB_PATH) {
  const sqlite = new Database(path);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return db;
}

export function createTestDb() {
  return createDb(":memory:");
}

export type Db = ReturnType<typeof createDb>;
