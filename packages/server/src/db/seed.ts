/**
 * Seed script — creates 5 test players (User1–User5) with picks.
 *
 * Each user picks the Nth nominee in every category (wrapping if fewer nominees).
 * User1 always picks the 1st nominee, User2 the 2nd, etc.
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

const USERS = ["User1", "User2", "User3", "User4", "User5"];
const PIN = "1234";

async function seed() {
	// Check categories exist
	const allCategories = await db.select().from(categories).orderBy(asc(categories.order));
	if (allCategories.length === 0) {
		console.error("No categories found. Import from Wikipedia first.");
		process.exit(1);
	}

	// Get nominations grouped by category
	const allNominations = await db.select().from(nominations);
	const nomsByCategory = new Map<string, typeof allNominations>();
	for (const nom of allNominations) {
		const list = nomsByCategory.get(nom.categoryId) ?? [];
		list.push(nom);
		nomsByCategory.set(nom.categoryId, list);
	}

	const hashedPin = await hashPin(PIN);
	const now = Date.now();

	for (let userIndex = 0; userIndex < USERS.length; userIndex++) {
		const name = USERS[userIndex]!;

		// Check if player already exists
		const existing = await db.select().from(players).where(eq(players.name, name)).limit(1);
		let playerId: string;

		if (existing.length > 0) {
			playerId = existing[0]!.id;
			console.log(`${name} already exists (${playerId})`);
		} else {
			playerId = createId();
			await db.insert(players).values({ id: playerId, name, pin: hashedPin, createdAt: now });
			console.log(`Created ${name} (${playerId})`);
		}

		// Make picks — User1 picks nominee[0], User2 picks nominee[1], etc.
		let pickCount = 0;
		for (const cat of allCategories) {
			const catNoms = nomsByCategory.get(cat.id) ?? [];
			if (catNoms.length === 0) continue;

			const nomineeIndex = userIndex % catNoms.length;
			const nominee = catNoms[nomineeIndex]!;

			await db.insert(picks).values({
				id: createId(),
				playerId,
				categoryId: cat.id,
				nominationId: nominee.id,
				createdAt: now,
				updatedAt: now,
			}).onConflictDoUpdate({
				target: [picks.playerId, picks.categoryId],
				set: { nominationId: nominee.id, updatedAt: now },
			});

			pickCount++;
		}

		console.log(`  ${pickCount} picks for ${name} (always picks nominee #${userIndex + 1})`);
	}

	console.log("\nDone! All 5 users have complete picks.");
	console.log("PIN for all users: 1234");
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
