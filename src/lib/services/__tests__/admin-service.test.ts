/**
 * Admin Service Tests
 *
 * Tests business logic in admin-service with mocked model layer.
 * Focus: Dashboard statistics aggregation, validation logic.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as adminService from "../admin-service";
import * as eventModel from "@/lib/models/event";
import * as gameModel from "@/lib/models/game";
import * as categoryModel from "@/lib/models/category";
import * as nominationModel from "@/lib/models/nomination";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";
import { buildEvent, buildGame, buildCategory, buildNomination } from "tests/factories";

// Mock all model imports
vi.mock("@/lib/models/event");
vi.mock("@/lib/models/game");
vi.mock("@/lib/models/category");
vi.mock("@/lib/models/nomination");
vi.mock("@/lib/models/person");
vi.mock("@/lib/models/work");

describe("adminService.validateAdminAccess", () => {
  it("returns true for any user (placeholder implementation)", async () => {
    const result = await adminService.validateAdminAccess("user-1");
    expect(result).toBe(true);
  });
});

describe("adminService.getAdminDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates stats from all models", async () => {
    const mockEvents = [
      buildEvent({ id: "event-1", name: "Oscars 2025" }),
      buildEvent({ id: "event-2", name: "Grammys 2025" }),
      buildEvent({ id: "event-3", name: "Emmys 2025" }),
    ];
    const mockGames = [
      buildGame({ id: "game-1", eventId: "event-1" }),
      buildGame({ id: "game-2", eventId: "event-1" }),
    ];
    const mockCategories = [
      buildCategory({ id: "cat-1", eventId: "event-1" }),
      buildCategory({ id: "cat-2", eventId: "event-1" }),
      buildCategory({ id: "cat-3", eventId: "event-2" }),
    ];
    const mockNominations = [
      buildNomination({ id: "nom-1", categoryId: "cat-1" }),
      buildNomination({ id: "nom-2", categoryId: "cat-1" }),
      buildNomination({ id: "nom-3", categoryId: "cat-2" }),
      buildNomination({ id: "nom-4", categoryId: "cat-3" }),
    ];

    vi.mocked(eventModel.findAll).mockResolvedValue(mockEvents as any);
    vi.mocked(gameModel.findAll).mockResolvedValue(mockGames as any);
    vi.mocked(categoryModel.findAll).mockResolvedValue(mockCategories as any);
    vi.mocked(nominationModel.findAll).mockResolvedValue(mockNominations as any);
    vi.mocked(workModel.findAll).mockResolvedValue([]);
    vi.mocked(personModel.findAll).mockResolvedValue([]);

    const result = await adminService.getAdminDashboardStats();

    expect(eventModel.findAll).toHaveBeenCalledOnce();
    expect(gameModel.findAll).toHaveBeenCalledOnce();
    expect(categoryModel.findAll).toHaveBeenCalledOnce();
    expect(nominationModel.findAll).toHaveBeenCalledOnce();
    expect(workModel.findAll).toHaveBeenCalledOnce();
    expect(personModel.findAll).toHaveBeenCalledOnce();

    expect(result).toEqual({
      categoryCount: 3,
      eventCount: 3,
      gameCount: 2,
      nominationCount: 4,
      personCount: 0,
      recentEvents: mockEvents.slice(0, 5),
      recentGames: mockGames.slice(0, 5),
      workCount: 0,
    });
  });

  it("limits recent events to 5", async () => {
    const mockEvents = Array.from({ length: 10 }, (_, i) =>
      buildEvent({ id: `event-${i}`, name: `Event ${i}` })
    );

    vi.mocked(eventModel.findAll).mockResolvedValue(mockEvents as any);
    vi.mocked(gameModel.findAll).mockResolvedValue([]);
    vi.mocked(categoryModel.findAll).mockResolvedValue([]);
    vi.mocked(nominationModel.findAll).mockResolvedValue([]);
    vi.mocked(workModel.findAll).mockResolvedValue([]);
    vi.mocked(personModel.findAll).mockResolvedValue([]);

    const result = await adminService.getAdminDashboardStats();

    expect(result.recentEvents).toHaveLength(5);
    expect(result.recentEvents[0].id).toBe("event-0");
    expect(result.recentEvents[4].id).toBe("event-4");
  });

  it("limits recent games to 5", async () => {
    const mockGames = Array.from({ length: 10 }, (_, i) =>
      buildGame({ id: `game-${i}`, name: `Game ${i}` })
    );

    vi.mocked(eventModel.findAll).mockResolvedValue([]);
    vi.mocked(gameModel.findAll).mockResolvedValue(mockGames as any);
    vi.mocked(categoryModel.findAll).mockResolvedValue([]);
    vi.mocked(nominationModel.findAll).mockResolvedValue([]);
    vi.mocked(workModel.findAll).mockResolvedValue([]);
    vi.mocked(personModel.findAll).mockResolvedValue([]);

    const result = await adminService.getAdminDashboardStats();

    expect(result.recentGames).toHaveLength(5);
    expect(result.recentGames[0].id).toBe("game-0");
    expect(result.recentGames[4].id).toBe("game-4");
  });

  it("returns empty stats when no data exists", async () => {
    vi.mocked(eventModel.findAll).mockResolvedValue([]);
    vi.mocked(gameModel.findAll).mockResolvedValue([]);
    vi.mocked(categoryModel.findAll).mockResolvedValue([]);
    vi.mocked(nominationModel.findAll).mockResolvedValue([]);
    vi.mocked(workModel.findAll).mockResolvedValue([]);
    vi.mocked(personModel.findAll).mockResolvedValue([]);

    const result = await adminService.getAdminDashboardStats();

    expect(result).toEqual({
      categoryCount: 0,
      eventCount: 0,
      gameCount: 0,
      nominationCount: 0,
      personCount: 0,
      recentEvents: [],
      recentGames: [],
      workCount: 0,
    });
  });
});
