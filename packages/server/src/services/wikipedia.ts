import { parseWikipediaUrl } from "../parsers/wikipedia";
import { createId } from "@paralleldrive/cuid2";
import { categories, nominations } from "../db/schema";
import type { Db } from "../db/connection";

export async function previewImport(url: string) {
  return parseWikipediaUrl(url);
}

export async function importFromWikipedia(url: string, db: Db) {
  const parsed = await parseWikipediaUrl(url);

  // Check if categories already exist
  const existing = await db.select().from(categories).limit(1);
  if (existing.length > 0) {
    throw new Error("Categories already exist. Reset the game first.");
  }

  // Insert in a transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < parsed.categories.length; i++) {
      const cat = parsed.categories[i];
      const catId = createId();
      await tx.insert(categories).values({
        id: catId,
        name: cat.name,
        order: i,
        points: 1,
        isRevealed: false,
        createdAt: Date.now(),
      });

      for (const nom of cat.nominations) {
        await tx.insert(nominations).values({
          id: createId(),
          categoryId: catId,
          title: nom.title,
          subtitle: nom.subtitle ?? "",
          imageUrl: nom.imageUrl,
          createdAt: Date.now(),
        });
      }
    }
  });

  return parsed;
}
