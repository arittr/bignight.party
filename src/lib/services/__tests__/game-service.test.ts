/**
 * Game Service Tests
 *
 * Note: Vitest is not yet set up in this project.
 * These are stub tests for when testing framework is implemented.
 * See: docs/constitutions/current/testing.md
 *
 * TODO: Implement when Vitest is configured
 * - Test joinGame creates GameParticipant when game exists
 * - Test joinGame throws when game doesn't exist
 * - Test joinGame handles duplicate membership gracefully
 * - Test checkMembership returns true when user is participant
 * - Test checkMembership returns false when user is not participant
 * - Test getUserGames returns all games with completion counts
 * - Test getUserGames calculates completion count correctly (picks vs categories)
 * - Test getUserGames returns empty array when user has no games
 * - Test resolveAccessCode returns { gameId, isMember: true } when user is member
 * - Test resolveAccessCode returns { gameId, isMember: false } when user is not member
 * - Test resolveAccessCode throws when access code is invalid
 */

// import { describe, it, expect, beforeEach, vi } from 'vitest'
// import * as gameService from '../game-service'
// import * as gameModel from '@/lib/models/game'
// import * as gameParticipantModel from '@/lib/models/game-participant'
// import * as pickModel from '@/lib/models/pick'
// import * as categoryModel from '@/lib/models/category'

// vi.mock('@/lib/models/game')
// vi.mock('@/lib/models/game-participant')
// vi.mock('@/lib/models/pick')
// vi.mock('@/lib/models/category')

// describe('gameService.joinGame', () => {
//   beforeEach(() => {
//     vi.clearAllMocks()
//   })

//   it('creates GameParticipant when game exists', async () => {
//     vi.mocked(gameModel.findById).mockResolvedValue({
//       id: 'game-1',
//       name: 'Test Game',
//       eventId: 'event-1',
//       status: 'OPEN',
//     } as any)
//     vi.mocked(gameParticipantModel.create).mockResolvedValue({
//       id: 'participant-1',
//       userId: 'user-1',
//       gameId: 'game-1',
//     } as any)

//     const result = await gameService.joinGame('user-1', 'game-1')

//     expect(gameModel.findById).toHaveBeenCalledWith('game-1')
//     expect(gameParticipantModel.create).toHaveBeenCalledWith({
//       userId: 'user-1',
//       gameId: 'game-1',
//     })
//     expect(result.id).toBe('participant-1')
//   })

//   it('throws when game does not exist', async () => {
//     vi.mocked(gameModel.findById).mockResolvedValue(null)

//     await expect(
//       gameService.joinGame('user-1', 'invalid-game')
//     ).rejects.toThrow('Game with id invalid-game not found')

//     expect(gameParticipantModel.create).not.toHaveBeenCalled()
//   })
// })

// describe('gameService.checkMembership', () => {
//   it('returns true when user is participant', async () => {
//     vi.mocked(gameParticipantModel.exists).mockResolvedValue(true)

//     const result = await gameService.checkMembership('user-1', 'game-1')

//     expect(gameParticipantModel.exists).toHaveBeenCalledWith('user-1', 'game-1')
//     expect(result).toBe(true)
//   })

//   it('returns false when user is not participant', async () => {
//     vi.mocked(gameParticipantModel.exists).mockResolvedValue(false)

//     const result = await gameService.checkMembership('user-1', 'game-1')

//     expect(gameParticipantModel.exists).toHaveBeenCalledWith('user-1', 'game-1')
//     expect(result).toBe(false)
//   })
// })

// describe('gameService.getUserGames', () => {
//   it('returns all games with completion counts', async () => {
//     vi.mocked(gameParticipantModel.findByUserId).mockResolvedValue([
//       {
//         id: 'participant-1',
//         userId: 'user-1',
//         gameId: 'game-1',
//         game: {
//           id: 'game-1',
//           name: 'Test Game',
//           eventId: 'event-1',
//           event: {
//             id: 'event-1',
//             name: 'Test Event',
//           },
//         },
//       },
//     ] as any)
//     vi.mocked(pickModel.getPicksCountByGameAndUser).mockResolvedValue(5)
//     vi.mocked(categoryModel.getCategoriesByEventId).mockResolvedValue([
//       { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' },
//     ] as any)

//     const result = await gameService.getUserGames('user-1')

//     expect(gameParticipantModel.findByUserId).toHaveBeenCalledWith('user-1')
//     expect(pickModel.getPicksCountByGameAndUser).toHaveBeenCalledWith('game-1', 'user-1')
//     expect(categoryModel.getCategoriesByEventId).toHaveBeenCalledWith('event-1')
//     expect(result).toHaveLength(1)
//     expect(result[0]).toMatchObject({
//       game: expect.any(Object),
//       picksCount: 5,
//       totalCategories: 6,
//     })
//   })

//   it('returns empty array when user has no games', async () => {
//     vi.mocked(gameParticipantModel.findByUserId).mockResolvedValue([])

//     const result = await gameService.getUserGames('user-1')

//     expect(result).toEqual([])
//   })
// })

// describe('gameService.resolveAccessCode', () => {
//   it('returns { gameId, isMember: true } when user is member', async () => {
//     vi.mocked(gameModel.findByAccessCode).mockResolvedValue({
//       id: 'game-1',
//       accessCode: 'TEST123',
//     } as any)
//     vi.mocked(gameParticipantModel.exists).mockResolvedValue(true)

//     const result = await gameService.resolveAccessCode('TEST123', 'user-1')

//     expect(gameModel.findByAccessCode).toHaveBeenCalledWith('TEST123')
//     expect(gameParticipantModel.exists).toHaveBeenCalledWith('user-1', 'game-1')
//     expect(result).toEqual({ gameId: 'game-1', isMember: true })
//   })

//   it('returns { gameId, isMember: false } when user is not member', async () => {
//     vi.mocked(gameModel.findByAccessCode).mockResolvedValue({
//       id: 'game-1',
//       accessCode: 'TEST123',
//     } as any)
//     vi.mocked(gameParticipantModel.exists).mockResolvedValue(false)

//     const result = await gameService.resolveAccessCode('TEST123', 'user-1')

//     expect(result).toEqual({ gameId: 'game-1', isMember: false })
//   })

//   it('throws when access code is invalid', async () => {
//     vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null)

//     await expect(
//       gameService.resolveAccessCode('INVALID', 'user-1')
//     ).rejects.toThrow('Game with access code INVALID not found')
//   })
// })
