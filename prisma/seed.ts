import { GameStatus, WorkType } from "@prisma/client";
import prisma from "@/lib/db/prisma";

async function main() {
  await prisma.pick.deleteMany();

  await prisma.nomination.deleteMany();

  await prisma.category.deleteMany();

  await prisma.work.deleteMany();

  await prisma.person.deleteMany();

  await prisma.game.deleteMany();

  await prisma.event.deleteMany();
  const oppenheimer = await prisma.work.create({
    data: {
      externalId: "tmdb:872585",
      imageUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      title: "Oppenheimer",
      type: WorkType.FILM,
      year: 2023,
    },
  });

  const barbie = await prisma.work.create({
    data: {
      externalId: "tmdb:346698",
      imageUrl: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
      title: "Barbie",
      type: WorkType.FILM,
      year: 2023,
    },
  });

  const killersOfTheFlowerMoon = await prisma.work.create({
    data: {
      externalId: "tmdb:466420",
      imageUrl: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
      title: "Killers of the Flower Moon",
      type: WorkType.FILM,
      year: 2023,
    },
  });
  const christopherNolan = await prisma.person.create({
    data: {
      externalId: "tmdb:525",
      imageUrl: "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
      name: "Christopher Nolan",
    },
  });

  const gretaGerwig = await prisma.person.create({
    data: {
      externalId: "tmdb:1221786",
      imageUrl: "https://image.tmdb.org/t/p/w500/5ZKYBkTN7OqK8aKsHBEX9r5dDkc.jpg",
      name: "Greta Gerwig",
    },
  });

  const martinScorsese = await prisma.person.create({
    data: {
      externalId: "tmdb:1032",
      imageUrl: "https://image.tmdb.org/t/p/w500/52dz4K0HQeIrNbbhJmNqnu9YoFr.jpg",
      name: "Martin Scorsese",
    },
  });
  const event = await prisma.event.create({
    data: {
      description: "The 97th Academy Awards will honor the best films released in 2024.",
      eventDate: new Date("2025-03-02"),
      name: "97th Academy Awards",
      slug: "oscars-2025",
    },
  });
  const _game = await prisma.game.create({
    data: {
      accessCode: "OSCARS2025",
      eventId: event.id,
      name: "Friends & Family Game",
      picksLockAt: new Date("2025-03-02T00:00:00Z"),
      status: GameStatus.SETUP,
    },
  });
  const bestPicture = await prisma.category.create({
    data: {
      eventId: event.id,
      isRevealed: false,
      name: "Best Picture",
      order: 1,
      points: 5,
    },
  });

  const bestDirector = await prisma.category.create({
    data: {
      eventId: event.id,
      isRevealed: false,
      name: "Best Director",
      order: 2,
      points: 3,
    },
  });

  const bestActor = await prisma.category.create({
    data: {
      eventId: event.id,
      isRevealed: false,
      name: "Best Actor",
      order: 3,
      points: 2,
    },
  });

  // Best Picture: 3 work-only nominations
  const _bestPictureNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      nominationText: "Oppenheimer",
      workId: oppenheimer.id,
    },
  });

  const _bestPictureNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      nominationText: "Barbie",
      workId: barbie.id,
    },
  });

  const _bestPictureNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestPicture.id,
      nominationText: "Killers of the Flower Moon",
      workId: killersOfTheFlowerMoon.id,
    },
  });

  // Best Director: 3 person+work nominations
  const _bestDirectorNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      nominationText: "Christopher Nolan for Oppenheimer",
      personId: christopherNolan.id,
      workId: oppenheimer.id,
    },
  });

  const _bestDirectorNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      nominationText: "Greta Gerwig for Barbie",
      personId: gretaGerwig.id,
      workId: barbie.id,
    },
  });

  const _bestDirectorNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestDirector.id,
      nominationText: "Martin Scorsese for Killers of the Flower Moon",
      personId: martinScorsese.id,
      workId: killersOfTheFlowerMoon.id,
    },
  });

  // Best Actor: 3 person+work nominations
  const _bestActorNom1 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      nominationText: "Cillian Murphy in Oppenheimer",
      personId: christopherNolan.id,
      workId: oppenheimer.id,
    },
  });

  const _bestActorNom2 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      nominationText: "Margot Robbie in Barbie",
      personId: gretaGerwig.id,
      workId: barbie.id,
    },
  });

  const _bestActorNom3 = await prisma.nomination.create({
    data: {
      categoryId: bestActor.id,
      nominationText: "Leonardo DiCaprio in Killers of the Flower Moon",
      personId: martinScorsese.id,
      workId: killersOfTheFlowerMoon.id,
    },
  });
}
const _adminUser = await prisma.user.create({
  data: {
    email: "drew@ritter.dev",
    name: "Admin",
    role: "ADMIN",
  },
});

main()
  .catch((_e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
