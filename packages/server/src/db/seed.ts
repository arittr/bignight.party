/**
 * Seed script — creates 15 test players with picks.
 *
 * - User1–User5: deterministic picks (Nth nominee based on user number)
 * - Player6–Player15: random picks for each category
 *
 * Usage: bun packages/server/src/db/seed.ts
 * Requires categories/nominations to already be imported (run Wikipedia import first).
 */

import { eq, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { createDb } from "./connection";
import { players, categories, nominations, picks } from "./schema";
import { hashPin } from "../auth/pin";

const db = createDb();

const DETERMINISTIC_USERS = ["User1", "User2", "User3", "User4", "User5"];
const RANDOM_USERS = [
	"Alice", "Bob", "Charlie", "Diana", "Eli",
	"Fiona", "Greg", "Hannah", "Ivan", "Julia",
];
const PIN = "1234";

async function seed() {
	const allCategories = await db.select().from(categories).orderBy(asc(categories.order));
	if (allCategories.length === 0) {
		console.error("No categories found. Import from Wikipedia first.");
		process.exit(1);
	}

	const allNominations = await db.select().from(nominations);
	const nomsByCategory = new Map<string, typeof allNominations>();
	for (const nom of allNominations) {
		const list = nomsByCategory.get(nom.categoryId) ?? [];
		list.push(nom);
		nomsByCategory.set(nom.categoryId, list);
	}

	const hashedPin = await hashPin(PIN);
	const now = Date.now();

	// Deterministic users: User1 picks 1st, User2 picks 2nd, etc.
	for (let i = 0; i < DETERMINISTIC_USERS.length; i++) {
		const name = DETERMINISTIC_USERS[i]!;
		const playerId = await ensurePlayer(name, hashedPin, now);
		let pickCount = 0;

		for (const cat of allCategories) {
			const catNoms = nomsByCategory.get(cat.id) ?? [];
			if (catNoms.length === 0) continue;
			const nominee = catNoms[i % catNoms.length]!;
			await upsertPick(playerId, cat.id, nominee.id, now);
			pickCount++;
		}

		console.log(`  ${pickCount} picks for ${name} (always picks nominee #${i + 1})`);
	}

	// Random users: random pick for each category
	for (const name of RANDOM_USERS) {
		const playerId = await ensurePlayer(name, hashedPin, now);
		let pickCount = 0;

		for (const cat of allCategories) {
			const catNoms = nomsByCategory.get(cat.id) ?? [];
			if (catNoms.length === 0) continue;
			const randomIndex = Math.floor(Math.random() * catNoms.length);
			const nominee = catNoms[randomIndex]!;
			await upsertPick(playerId, cat.id, nominee.id, now);
			pickCount++;
		}

		console.log(`  ${pickCount} picks for ${name} (random)`);
	}

	console.log(`\nDone! ${DETERMINISTIC_USERS.length + RANDOM_USERS.length} users seeded.`);
	console.log("PIN for all users: 1234");
}

async function ensurePlayer(name: string, hashedPin: string, now: number): Promise<string> {
	const existing = await db.select().from(players).where(eq(players.name, name)).limit(1);
	if (existing.length > 0) {
		console.log(`${name} already exists`);
		return existing[0]!.id;
	}
	const id = createId();
	await db.insert(players).values({ id, name, pin: hashedPin, createdAt: now });
	console.log(`Created ${name}`);
	return id;
}

async function upsertPick(playerId: string, categoryId: string, nominationId: string, now: number) {
	await db.insert(picks).values({
		id: createId(),
		playerId,
		categoryId,
		nominationId,
		createdAt: now,
		updatedAt: now,
	}).onConflictDoUpdate({
		target: [picks.playerId, picks.categoryId],
		set: { nominationId, updatedAt: now },
	});
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
