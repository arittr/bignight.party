import { GameStatus, WorkType } from "@prisma/client";
import prisma from "@/lib/db/prisma";

async function main() {
  console.log("Starting seed script...");

  // Delete existing data in reverse dependency order
  console.log("Deleting existing data...");
  await prisma.pick.deleteMany();
  console.log("  - Deleted picks");

  await prisma.nomination.deleteMany();
  console.log("  - Deleted nominations");

  await prisma.category.deleteMany();
  console.log("  - Deleted categories");

  await prisma.work.deleteMany();
  console.log("  - Deleted works");

  await prisma.person.deleteMany();
  console.log("  - Deleted people");

  await prisma.game.deleteMany();
  console.log("  - Deleted games");

  await prisma.event.deleteMany();
  console.log("  - Deleted events");

  console.log("\nCreating seed data...");

  // Create 3 Work records (type: FILM)
  console.log("\nCreating works...");
  const oppenheimer = await prisma.work.create({
    data: {
      type: WorkType.FILM,
      title: "Oppenheimer",
      year: 2023,
      posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      externalId: "tmdb:872585",
    },
  });
  console.log(`  - Created work: ${oppenheimer.title}`);

  const barbie = await prisma.work.create({
    data: {
      type: WorkType.FILM,
      title: "Barbie",
      year: 2023,
      posterUrl: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
      externalId: "tmdb:346698",
    },
  });
  console.log(`  - Created work: ${barbie.title}`);

  const killersOfTheFlowerMoon = await prisma.work.create({
    data: {
      type: WorkType.FILM,
      title: "Killers of the Flower Moon",
      year: 2023,
      posterUrl: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
      externalId: "tmdb:466420",
    },
  });
  console.log(`  - Created work: ${killersOfTheFlowerMoon.title}`);

  // Create 3 Person records
  console.log("\nCreating people...");
  const christopherNolan = await prisma.person.create({
    data: {
      name: "Christopher Nolan",
      imageUrl: "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
      externalId: "tmdb:525",
    },
  });
  console.log(`  - Created person: ${christopherNolan.name}`);

  const gretaGerwig = await prisma.person.create({
    data: {
      name: "Greta Gerwig",
      imageUrl: "https://image.tmdb.org/t/p/w500/5ZKYBkTN7OqK8aKsHBEX9r5dDkc.jpg",
      externalId: "tmdb:1221786",
    },
  });
  console.log(`  - Created person: ${gretaGerwig.name}`);

  const martinScorsese = await prisma.person.create({
    data: {
      name: "Martin Scorsese",
      imageUrl: "https://image.tmdb.org/t/p/w500/52dz4K0HQeIrNbbhJmNqnu9YoFr.jpg",
      externalId: "tmdb:1032",
    },
  });
  console.log(`  - Created person: ${martinScorsese.name}`);

  // Create 1 Event: "97th Academy Awards"
  console.log("\nCreating event...");
  const event = await prisma.event.create({
    data: {
      name: "97th Academy Awards",
      slug: "oscars-2025",
      description: "The 97th Academy Awards will honor the best films released in 2024.",
      eventDate: new Date("2025-03-02"),
    },
  });
  console.log(`  - Created event: ${event.name}`);

  // Create 1 Game: "Friends & Family Game"
  console.log("\nCreating game...");
  const game = await prisma.game.create({
    data: {
      eventId: event.id,
      name: "Friends & Family Game",
      accessCode: "OSCARS2025",
      status: GameStatus.SETUP,
      picksLockAt: new Date("2025-03-02T00:00:00Z"),
    },
  });
  console.log(`  - Created game: ${game.name}`);

  // Create 3 Categories
  console.log("\nCreating categories...");
  const bestPicture = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Best Picture",
      order: 1,
      points: 5,
      isRevealed: false,
    },
  });
  console.log(`  - Created category: ${bestPicture.name}`);

  const bestDirector = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Best Director",
      order: 2,
      points: 3,
      isRevealed: false,
    },
  });
  console.log(`  - Created category: ${bestDirector.name}`);

  const bestActor = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Best Actor",
      order: 3,
      points: 2,
      isRevealed: false,
    },
  });
  console.log(`  - Created category: ${bestActor.name}`);

  // Create 9 Nominations
  console.log("\nCreating nominations...");

  // Best Picture: 3 work-only nominations
  const bestPictureNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      workId: oppenheimer.id,
      nominationText: "Oppenheimer",
    },
  });
  console.log(`  - Created nomination: ${bestPictureNom1.nominationText}`);

  const bestPictureNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      workId: barbie.id,
      nominationText: "Barbie",
    },
  });
  console.log(`  - Created nomination: ${bestPictureNom2.nominationText}`);

  const bestPictureNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      workId: killersOfTheFlowerMoon.id,
      nominationText: "Killers of the Flower Moon",
    },
  });
  console.log(`  - Created nomination: ${bestPictureNom3.nominationText}`);

  // Best Director: 3 person+work nominations
  const bestDirectorNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      personId: christopherNolan.id,
      workId: oppenheimer.id,
      nominationText: "Christopher Nolan for Oppenheimer",
    },
  });
  console.log(`  - Created nomination: ${bestDirectorNom1.nominationText}`);

  const bestDirectorNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      personId: gretaGerwig.id,
      workId: barbie.id,
      nominationText: "Greta Gerwig for Barbie",
    },
  });
  console.log(`  - Created nomination: ${bestDirectorNom2.nominationText}`);

  const bestDirectorNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      personId: martinScorsese.id,
      workId: killersOfTheFlowerMoon.id,
      nominationText: "Martin Scorsese for Killers of the Flower Moon",
    },
  });
  console.log(`  - Created nomination: ${bestDirectorNom3.nominationText}`);

  // Best Actor: 3 person+work nominations
  const bestActorNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      personId: christopherNolan.id,
      workId: oppenheimer.id,
      nominationText: "Cillian Murphy in Oppenheimer",
    },
  });
  console.log(`  - Created nomination: ${bestActorNom1.nominationText}`);

  const bestActorNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      personId: gretaGerwig.id,
      workId: barbie.id,
      nominationText: "Margot Robbie in Barbie",
    },
  });
  console.log(`  - Created nomination: ${bestActorNom2.nominationText}`);

  const bestActorNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      personId: martinScorsese.id,
      workId: killersOfTheFlowerMoon.id,
      nominationText: "Leonardo DiCaprio in Killers of the Flower Moon",
    },
  });
  console.log(`  - Created nomination: ${bestActorNom3.nominationText}`);

  console.log("\nSeed completed successfully!");
  console.log(`  - Events: 1`);
  console.log(`  - Games: 1`);
  console.log(`  - Categories: 3`);
  console.log(`  - Works: 3`);
  console.log(`  - People: 3`);
  console.log(`  - Nominations: 9`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
