import { describe, expect, it } from "vitest";
import {
  type EventWithCategoryCount,
  extractCount,
  formatDateForDisplay,
  formatStatusForDisplay,
  formatWorkTypeForDisplay,
  type GameWithParticipantCount,
  type PersonWithNominationCount,
  transformEventsToListItems,
  transformEventToListItem,
  transformGamesToListItems,
  transformGameToListItem,
  transformPeopleToListItems,
  transformPersonToListItem,
  transformWorksToListItems,
  transformWorkToListItem,
  type WorkWithNominationCount,
} from "./data-transforms";

describe("data-transforms", () => {
  describe("transformEventToListItem", () => {
    it("should transform event with category count", () => {
      const event: EventWithCategoryCount = {
        _count: {
          categories: 23,
        },
        description: "The Oscars 2025",
        eventDate: new Date("2025-03-10"),
        id: "evt_1",
        name: "97th Academy Awards",
        slug: "oscars-2025",
      };

      const result = transformEventToListItem(event);

      expect(result).toEqual({
        _count: {
          categories: 23,
        },
        description: "The Oscars 2025",
        eventDate: new Date("2025-03-10"),
        id: "evt_1",
        name: "97th Academy Awards",
        slug: "oscars-2025",
      });
    });

    it("should handle null description", () => {
      const event: EventWithCategoryCount = {
        _count: {
          categories: 27,
        },
        description: null,
        eventDate: new Date("2025-01-05"),
        id: "evt_2",
        name: "Golden Globes",
        slug: "golden-globes-2025",
      };

      const result = transformEventToListItem(event);

      expect(result.description).toBeNull();
    });
  });

  describe("transformEventsToListItems", () => {
    it("should transform multiple events", () => {
      const events: EventWithCategoryCount[] = [
        {
          _count: { categories: 10 },
          description: null,
          eventDate: new Date("2025-01-01"),
          id: "evt_1",
          name: "Event 1",
          slug: "event-1",
        },
        {
          _count: { categories: 15 },
          description: "Description",
          eventDate: new Date("2025-02-01"),
          id: "evt_2",
          name: "Event 2",
          slug: "event-2",
        },
      ];

      const result = transformEventsToListItems(events);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("evt_1");
      expect(result[1].id).toBe("evt_2");
    });

    it("should handle empty array", () => {
      const result = transformEventsToListItems([]);
      expect(result).toEqual([]);
    });
  });

  describe("transformGameToListItem", () => {
    it("should transform game with participant count", () => {
      const game: GameWithParticipantCount = {
        _count: {
          participants: 15,
        },
        accessCode: "ABC123",
        event: {
          id: "evt_1",
          name: "97th Academy Awards",
        },
        id: "game_1",
        name: "Oscar Pool 2025",
        picksLockAt: new Date("2025-03-09T18:00:00"),
        status: "OPEN",
      };

      const result = transformGameToListItem(game);

      expect(result).toEqual({
        accessCode: "ABC123",
        eventName: "97th Academy Awards",
        id: "game_1",
        name: "Oscar Pool 2025",
        participantCount: 15,
        picksLockAt: new Date("2025-03-09T18:00:00"),
        status: "OPEN",
      });
    });

    it("should handle null picksLockAt", () => {
      const game: GameWithParticipantCount = {
        _count: {
          participants: 0,
        },
        accessCode: "XYZ789",
        event: {
          id: "evt_1",
          name: "Test Event",
        },
        id: "game_2",
        name: "Test Game",
        picksLockAt: null,
        status: "SETUP",
      };

      const result = transformGameToListItem(game);

      expect(result.picksLockAt).toBeNull();
      expect(result.participantCount).toBe(0);
    });

    it("should handle all game statuses", () => {
      const statuses: Array<"SETUP" | "OPEN" | "LIVE" | "COMPLETED"> = [
        "SETUP",
        "OPEN",
        "LIVE",
        "COMPLETED",
      ];

      for (const status of statuses) {
        const game: GameWithParticipantCount = {
          _count: { participants: 0 },
          accessCode: "ABC",
          event: { id: "evt_1", name: "Event" },
          id: "game_1",
          name: "Test",
          picksLockAt: null,
          status,
        };

        const result = transformGameToListItem(game);
        expect(result.status).toBe(status);
      }
    });
  });

  describe("transformGamesToListItems", () => {
    it("should transform multiple games", () => {
      const games: GameWithParticipantCount[] = [
        {
          _count: { participants: 5 },
          accessCode: "ABC",
          event: { id: "evt_1", name: "Event 1" },
          id: "game_1",
          name: "Game 1",
          picksLockAt: null,
          status: "OPEN",
        },
        {
          _count: { participants: 10 },
          accessCode: "XYZ",
          event: { id: "evt_2", name: "Event 2" },
          id: "game_2",
          name: "Game 2",
          picksLockAt: new Date(),
          status: "LIVE",
        },
      ];

      const result = transformGamesToListItems(games);

      expect(result).toHaveLength(2);
      expect(result[0].eventName).toBe("Event 1");
      expect(result[1].eventName).toBe("Event 2");
    });
  });

  describe("transformPersonToListItem", () => {
    it("should transform person with nomination count", () => {
      const person: PersonWithNominationCount = {
        _count: {
          nominations: 3,
        },
        id: "person_1",
        name: "Margot Robbie",
        slug: "margot-robbie",
      };

      const result = transformPersonToListItem(person);

      expect(result).toEqual({
        id: "person_1",
        name: "Margot Robbie",
        nominationCount: 3,
        slug: "margot-robbie",
      });
    });

    it("should handle missing _count field", () => {
      const person: PersonWithNominationCount = {
        id: "person_2",
        name: "Ryan Gosling",
        slug: "ryan-gosling",
      };

      const result = transformPersonToListItem(person);

      expect(result.nominationCount).toBe(0);
    });
  });

  describe("transformPeopleToListItems", () => {
    it("should transform multiple people", () => {
      const people: PersonWithNominationCount[] = [
        { _count: { nominations: 5 }, id: "p1", name: "Person 1", slug: "person-1" },
        { id: "p2", name: "Person 2", slug: "person-2" },
      ];

      const result = transformPeopleToListItems(people);

      expect(result).toHaveLength(2);
      expect(result[0].nominationCount).toBe(5);
      expect(result[1].nominationCount).toBe(0);
    });
  });

  describe("transformWorkToListItem", () => {
    it("should transform work with nomination count", () => {
      const work: WorkWithNominationCount = {
        _count: {
          nominations: 8,
        },
        id: "work_1",
        releaseYear: 2023,
        slug: "barbie",
        title: "Barbie",
        type: "FILM",
      };

      const result = transformWorkToListItem(work);

      expect(result).toEqual({
        id: "work_1",
        nominationCount: 8,
        releaseYear: 2023,
        slug: "barbie",
        title: "Barbie",
        type: "FILM",
      });
    });

    it("should handle null releaseYear", () => {
      const work: WorkWithNominationCount = {
        _count: {
          nominations: 0,
        },
        id: "work_2",
        releaseYear: null,
        slug: "test-work",
        title: "Test Work",
        type: "TV_SHOW",
      };

      const result = transformWorkToListItem(work);

      expect(result.releaseYear).toBeNull();
    });

    it("should handle all work types", () => {
      const types: Array<"FILM" | "TV_SHOW" | "ALBUM" | "SONG" | "PLAY" | "BOOK"> = [
        "FILM",
        "TV_SHOW",
        "ALBUM",
        "SONG",
        "PLAY",
        "BOOK",
      ];

      for (const type of types) {
        const work: WorkWithNominationCount = {
          _count: { nominations: 0 },
          id: "work_1",
          releaseYear: 2023,
          slug: "test",
          title: "Test",
          type,
        };

        const result = transformWorkToListItem(work);
        expect(result.type).toBe(type);
      }
    });
  });

  describe("transformWorksToListItems", () => {
    it("should transform multiple works", () => {
      const works: WorkWithNominationCount[] = [
        {
          _count: { nominations: 5 },
          id: "w1",
          releaseYear: 2023,
          slug: "work-1",
          title: "Work 1",
          type: "FILM",
        },
        {
          id: "w2",
          releaseYear: 2024,
          slug: "work-2",
          title: "Work 2",
          type: "TV_SHOW",
        },
      ];

      const result = transformWorksToListItems(works);

      expect(result).toHaveLength(2);
      expect(result[0].nominationCount).toBe(5);
      expect(result[1].nominationCount).toBe(0);
    });
  });

  describe("formatDateForDisplay", () => {
    it("should format date correctly", () => {
      const date = new Date("2025-03-10");
      const result = formatDateForDisplay(date);

      expect(result).toMatch(/Mar.*10.*2025/);
    });

    it("should handle null date", () => {
      const result = formatDateForDisplay(null);
      expect(result).toBe("—");
    });
  });

  describe("formatStatusForDisplay", () => {
    it("should format SETUP status", () => {
      expect(formatStatusForDisplay("SETUP")).toBe("Setup");
    });

    it("should format OPEN status", () => {
      expect(formatStatusForDisplay("OPEN")).toBe("Open");
    });

    it("should format LIVE status", () => {
      expect(formatStatusForDisplay("LIVE")).toBe("Live");
    });

    it("should format COMPLETED status", () => {
      expect(formatStatusForDisplay("COMPLETED")).toBe("Completed");
    });
  });

  describe("formatWorkTypeForDisplay", () => {
    it("should format FILM type", () => {
      expect(formatWorkTypeForDisplay("FILM")).toBe("Film");
    });

    it("should format TV_SHOW type", () => {
      expect(formatWorkTypeForDisplay("TV_SHOW")).toBe("TV Show");
    });

    it("should format ALBUM type", () => {
      expect(formatWorkTypeForDisplay("ALBUM")).toBe("Album");
    });

    it("should format SONG type", () => {
      expect(formatWorkTypeForDisplay("SONG")).toBe("Song");
    });

    it("should format PLAY type", () => {
      expect(formatWorkTypeForDisplay("PLAY")).toBe("Play");
    });

    it("should format BOOK type", () => {
      expect(formatWorkTypeForDisplay("BOOK")).toBe("Book");
    });
  });

  describe("extractCount", () => {
    it("should extract count from _count field", () => {
      const entity: { id: string; _count: { items: number; users: number } } = {
        _count: {
          items: 5,
          users: 10,
        },
        id: "1",
      };

      expect(extractCount(entity, "items")).toBe(5);
      expect(extractCount(entity, "users")).toBe(10);
    });

    it("should return 0 for missing _count field", () => {
      const entity: { id: string; _count?: undefined } = {
        id: "1",
      };

      expect(extractCount(entity, "items")).toBe(0);
    });

    it("should return 0 for missing count property", () => {
      const entity: { id: string; _count: { items: number } } = {
        _count: {
          items: 5,
        },
        id: "1",
      };

      expect(extractCount(entity, "nonexistent")).toBe(0);
    });
  });
});
