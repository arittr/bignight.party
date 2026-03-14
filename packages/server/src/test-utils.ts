import { createTestDb } from "./db/connection";
import { createApp } from "./app";
import { signToken } from "./auth/token";
import { gameConfig } from "./db/schema";

export function createTestApp() {
  const db = createTestDb();
  // Insert singleton game config row
  db.insert(gameConfig).values({ id: 1 }).run();
  const app = createApp(db);
  return { app, db };
}

export async function createPlayerToken(playerId: string, isAdmin = false) {
  return signToken({ playerId, isAdmin });
}
