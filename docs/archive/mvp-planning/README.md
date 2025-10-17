# BigNight.Party - Specifications

Complete technical documentation for the Oscars prediction game.

## Documents

### [Overview](./overview.md)
Project vision, problem statement, solution summary, and success criteria.

**Read this first** to understand what we're building and why.

### [Requirements & User Stories](./requirements.md)
Detailed user stories for all features across player, admin, and authentication flows.

**Use this for** feature planning and acceptance criteria.

### [Architecture](./architecture.md)
Complete technical architecture including:
- Technology stack decisions and rationale
- Layered architecture pattern (UI → Actions → Services → Models → DB)
- Real-time WebSocket event flow
- Project structure and file organization
- Security considerations
- Deployment architecture

**Use this for** technical implementation guidance.

### [Database Schema](./database-schema.md)
Complete Prisma schema with:
- Entity relationships
- Auth.js integration
- Indexes and performance optimizations
- Common query patterns
- Migration strategy

**Use this for** database implementation and model layer development.

---

## Development Phases

### Phase 1: MVP (Current Focus)
- ✅ Magic link authentication (Auth.js + Resend)
- ✅ Admin category/nominee management
- ✅ Wizard-based pick selection with navigation
- ✅ Real-time leaderboard (WebSocket updates)
- ✅ Category-by-category reveals
- ✅ Access code for game entry

**Goal:** Ship before 2025 Oscars (March 10, 2025)

### Phase 2: Enhancements
- 🔄 Import categories from external APIs
- 🔄 Live emoji reactions on leaderboard
- 🔄 Aggregate prediction statistics
- 🔄 Mobile optimizations

**Goal:** Enhanced experience for 2026 Oscars

### Phase 3: Multi-Show Support
- 🔮 Event templates for Grammys, Golden Globes, etc.
- 🔮 Historical user stats across events
- 🔮 Advanced analytics and insights

**Goal:** Platform for all major awards shows

---

## Quick Start

### For Developers

1. **Read the overview** - Understand the product
2. **Review architecture** - Understand tech decisions
3. **Study database schema** - Understand data model
4. **Pick a user story** - Start implementing

### For Product Planning

1. **Review requirements** - Understand all user stories
2. **Check acceptance criteria** - Understand definition of done
3. **Prioritize stories** - Decide what to build when

---

## Key Architectural Decisions

### Why Auth.js?
- Built-in magic link support
- Prisma adapter included
- Industry-standard security
- Extensible for future OAuth

### Why Socket.io?
- Bidirectional (needed for reactions)
- Automatic reconnection
- Room support (event isolation)
- Fallback to polling

### Why Model/Service Pattern?
- Clear separation of concerns
- Easier testing
- Reusable business logic
- Isolated database access

### Why PostgreSQL?
- Relational data fits naturally
- ACID transactions for score integrity
- Excellent Prisma support
- Neon provides serverless option

---

## Non-Functional Requirements

### Performance Targets
- Leaderboard updates: < 1 second
- Pick wizard load: < 2 seconds
- Concurrent users: 50+ (WebSocket)

### Security
- Magic links expire: 10 minutes
- Sessions expire: 30 days
- CSRF protection: All mutations
- Input validation: Zod schemas

### Browser Support
- iOS Safari (mobile primary)
- Android Chrome
- Desktop: Chrome, Firefox, Safari

---

## Related Documentation

- [Project README](../README.md) - Setup and development commands
- [Biome Config](../biome.jsonc) - Linting rules
- [VSCode Launch](../.vscode/launch.json) - Debugging configs

---

## Questions or Changes?

If you have questions about these specs or want to propose changes:

1. **Small clarifications** - Add inline comments to this file
2. **Architecture changes** - Update relevant spec document
3. **New features** - Add user stories to requirements.md
4. **Schema changes** - Update database-schema.md and create migration

Keep specs in sync with implementation!
