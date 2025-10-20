/**
 * GameParticipant Model Tests
 *
 * Note: Vitest is not yet set up in this project.
 * These are stub tests for when testing framework is implemented.
 * See: docs/constitutions/current/testing.md
 *
 * TODO: Implement when Vitest is configured
 * - Test create() creates participant with valid data
 * - Test create() enforces unique constraint (userId, gameId)
 * - Test findByUserId() returns all games for user with event includes
 * - Test findByGameId() returns all participants with user data
 * - Test exists() returns true when participant exists
 * - Test exists() returns false when participant doesn't exist
 * - Test deleteByUserAndGame() removes membership
 * - Test deleteByUserAndGame() throws when membership doesn't exist
 */

// import { describe, it, expect, beforeEach } from 'vitest'
// import * as gameParticipantModel from '../game-participant'
// import prisma from '@/lib/db/prisma'

// describe('gameParticipantModel.create', () => {
//   beforeEach(async () => {
//     await prisma.gameParticipant.deleteMany()
//   })

//   it('creates participant with valid data', async () => {
//     const participant = await gameParticipantModel.create({
//       userId: 'user-1',
//       gameId: 'game-1',
//     })
//     expect(participant.id).toBeDefined()
//     expect(participant.userId).toBe('user-1')
//     expect(participant.gameId).toBe('game-1')
//   })

//   it('enforces unique constraint on (userId, gameId)', async () => {
//     await gameParticipantModel.create({
//       userId: 'user-1',
//       gameId: 'game-1',
//     })
//     await expect(
//       gameParticipantModel.create({
//         userId: 'user-1',
//         gameId: 'game-1',
//       })
//     ).rejects.toThrow()
//   })
// })

// describe('gameParticipantModel.findByUserId', () => {
//   it('returns all games for user with event includes', async () => {
//     const participants = await gameParticipantModel.findByUserId('user-1')
//     expect(Array.isArray(participants)).toBe(true)
//     if (participants.length > 0) {
//       expect(participants[0].game).toBeDefined()
//       expect(participants[0].game.event).toBeDefined()
//     }
//   })

//   it('orders by joinedAt descending', async () => {
//     const participants = await gameParticipantModel.findByUserId('user-1')
//     // Verify ordering logic
//   })
// })

// describe('gameParticipantModel.findByGameId', () => {
//   it('returns all participants with user data', async () => {
//     const participants = await gameParticipantModel.findByGameId('game-1')
//     expect(Array.isArray(participants)).toBe(true)
//     if (participants.length > 0) {
//       expect(participants[0].user).toBeDefined()
//     }
//   })
// })

// describe('gameParticipantModel.exists', () => {
//   it('returns true when participant exists', async () => {
//     await gameParticipantModel.create({
//       userId: 'user-1',
//       gameId: 'game-1',
//     })
//     const result = await gameParticipantModel.exists('user-1', 'game-1')
//     expect(result).toBe(true)
//   })

//   it('returns false when participant does not exist', async () => {
//     const result = await gameParticipantModel.exists('user-1', 'game-1')
//     expect(result).toBe(false)
//   })
// })

// describe('gameParticipantModel.deleteByUserAndGame', () => {
//   it('removes membership', async () => {
//     await gameParticipantModel.create({
//       userId: 'user-1',
//       gameId: 'game-1',
//     })
//     await gameParticipantModel.deleteByUserAndGame('user-1', 'game-1')
//     const exists = await gameParticipantModel.exists('user-1', 'game-1')
//     expect(exists).toBe(false)
//   })

//   it('throws when membership does not exist', async () => {
//     await expect(
//       gameParticipantModel.deleteByUserAndGame('user-1', 'game-1')
//     ).rejects.toThrow()
//   })
// })
