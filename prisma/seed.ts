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
      externalId: "tmdb:872585",
      posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      title: "Oppenheimer",
      type: WorkType.FILM,
      year: 2023,
    },
  });
  console.log(`  - Created work: ${oppenheimer.title}`);

  const barbie = await prisma.work.create({
    data: {
      externalId: "tmdb:346698",
      posterUrl: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
      title: "Barbie",
      type: WorkType.FILM,
      year: 2023,
    },
  });
  console.log(`  - Created work: ${barbie.title}`);

  const killersOfTheFlowerMoon = await prisma.work.create({
    data: {
      externalId: "tmdb:466420",
      posterUrl: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
      title: "Killers of the Flower Moon",
      type: WorkType.FILM,
      year: 2023,
    },
  });
  console.log(`  - Created work: ${killersOfTheFlowerMoon.title}`);

  // Create 3 Person records
  console.log("\nCreating people...");
  const christopherNolan = await prisma.person.create({
    data: {
      externalId: "tmdb:525",
      imageUrl: "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
      name: "Christopher Nolan",
    },
  });
  console.log(`  - Created person: ${christopherNolan.name}`);

  const gretaGerwig = await prisma.person.create({
    data: {
      externalId: "tmdb:1221786",
      imageUrl: "https://image.tmdb.org/t/p/w500/5ZKYBkTN7OqK8aKsHBEX9r5dDkc.jpg",
      name: "Greta Gerwig",
    },
  });
  console.log(`  - Created person: ${gretaGerwig.name}`);

  const martinScorsese = await prisma.person.create({
    data: {
      externalId: "tmdb:1032",
      imageUrl: "https://image.tmdb.org/t/p/w500/52dz4K0HQeIrNbbhJmNqnu9YoFr.jpg",
      name: "Martin Scorsese",
    },
  });
  console.log(`  - Created person: ${martinScorsese.name}`);

  // Create 1 Event: "97th Academy Awards"
  console.log("\nCreating event...");
  const event = await prisma.event.create({
    data: {
      description: "The 97th Academy Awards will honor the best films released in 2024.",
      eventDate: new Date("2025-03-02"),
      name: "97th Academy Awards",
      slug: "oscars-2025",
    },
  });
  console.log(`  - Created event: ${event.name}`);

  // Create 1 Game: "Friends & Family Game"
  console.log("\nCreating game...");
  const game = await prisma.game.create({
    data: {
      accessCode: "OSCARS2025",
      eventId: event.id,
      name: "Friends & Family Game",
      picksLockAt: new Date("2025-03-02T00:00:00Z"),
      status: GameStatus.SETUP,
    },
  });
  console.log(`  - Created game: ${game.name}`);

  // Create 3 Categories
  console.log("\nCreating categories...");
  const bestPicture = await prisma.category.create({
    data: {
      eventId: event.id,
      isRevealed: false,
      name: "Best Picture",
      order: 1,
      points: 5,
    },
  });
  console.log(`  - Created category: ${bestPicture.name}`);

  const bestDirector = await prisma.category.create({
    data: {
      eventId: event.id,
      isRevealed: false,
      name: "Best Director",
      order: 2,
      points: 3,
    },
  });
  console.log(`  - Created category: ${bestDirector.name}`);

  const bestActor = await prisma.category.create({
    data: {
      eventId: event.id,
      isRevealed: false,
      name: "Best Actor",
      order: 3,
      points: 2,
    },
  });
  console.log(`  - Created category: ${bestActor.name}`);

  // Create 9 Nominations
  console.log("\nCreating nominations...");

  // Best Picture: 3 work-only nominations
  const bestPictureNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      nominationText: "Oppenheimer",
      workId: oppenheimer.id,
    },
  });
  console.log(`  - Created nomination: ${bestPictureNom1.nominationText}`);

  const bestPictureNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      nominationText: "Barbie",
      workId: barbie.id,
    },
  });
  console.log(`  - Created nomination: ${bestPictureNom2.nominationText}`);

  const bestPictureNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      nominationText: "Killers of the Flower Moon",
      workId: killersOfTheFlowerMoon.id,
    },
  });
  console.log(`  - Created nomination: ${bestPictureNom3.nominationText}`);

  // Best Director: 3 person+work nominations
  const bestDirectorNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      nominationText: "Christopher Nolan for Oppenheimer",
      personId: christopherNolan.id,
      workId: oppenheimer.id,
    },
  });
  console.log(`  - Created nomination: ${bestDirectorNom1.nominationText}`);

  const bestDirectorNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      nominationText: "Greta Gerwig for Barbie",
      personId: gretaGerwig.id,
      workId: barbie.id,
    },
  });
  console.log(`  - Created nomination: ${bestDirectorNom2.nominationText}`);

  const bestDirectorNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      nominationText: "Martin Scorsese for Killers of the Flower Moon",
      personId: martinScorsese.id,
      workId: killersOfTheFlowerMoon.id,
    },
  });
  console.log(`  - Created nomination: ${bestDirectorNom3.nominationText}`);

  // Best Actor: 3 person+work nominations
  const bestActorNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      nominationText: "Cillian Murphy in Oppenheimer",
      personId: christopherNolan.id,
      workId: oppenheimer.id,
    },
  });
  console.log(`  - Created nomination: ${bestActorNom1.nominationText}`);

  const bestActorNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      nominationText: "Margot Robbie in Barbie",
      personId: gretaGerwig.id,
      workId: barbie.id,
    },
  });
  console.log(`  - Created nomination: ${bestActorNom2.nominationText}`);

  const bestActorNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      nominationText: "Leonardo DiCaprio in Killers of the Flower Moon",
      personId: martinScorsese.id,
      workId: killersOfTheFlowerMoon.id,
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
