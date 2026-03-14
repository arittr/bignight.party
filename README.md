# BigNight v2

Oscar prediction game for friends. Players pick nominees before the ceremony, then watch a live leaderboard update as winners are announced.

## Prerequisites

- [Bun](https://bun.sh) v1.3+

## Setup

```bash
# Install dependencies
bun install

# Copy environment config
cp .env.example .env
# Edit .env — set JWT_SECRET and ADMIN_PIN at minimum
```

## Development

```bash
# Start both server and web dev server
bun run dev
```

This starts:
- **Vite dev server** at `http://localhost:5173` (frontend)
- **Hono API server** at `http://localhost:3000` (backend + WebSocket)

Vite proxies `/api` and `/socket.io` requests to the backend automatically.

### Running just the server or frontend

```bash
# Server only (watches for changes)
cd packages/server && bun dev

# Frontend only
cd packages/web && bun dev
```

## Database Migrations

The database is SQLite (file-based, no external dependency). Migrations are managed by Drizzle Kit.

```bash
# Generate a new migration after schema changes
cd packages/server && bun db:generate

# Apply migrations (happens automatically on server start via createDb)
cd packages/server && bun db:migrate

# Browse the database
cd packages/server && bun db:studio
```

Migrations run automatically on server startup (via `createDb()`). The dev database is created at `packages/server/bignight.db` by default. Set `DB_PATH` in `.env` to change the location.

## Tests

```bash
# Run all tests
bun run test

# Run by package
cd packages/shared && bun vitest run
cd packages/server && bun run ./node_modules/.bin/vitest run
cd packages/web && bun vitest run

# Watch mode
cd packages/shared && bun vitest
```

Note: Server tests use `bun run ./node_modules/.bin/vitest` to ensure Bun runtime (needed for `bun:sqlite` and `Bun.password`).

## Production

```bash
# Build the frontend
bun run build

# Start the production server (serves API + static files)
bun run start
```

In production, the Hono server serves the Vite build from `packages/web/dist/`.

## Game Flow

1. **Admin** navigates to `/admin`, logs in with `ADMIN_PIN`
2. **Admin** pastes a Wikipedia Academy Awards URL → Preview → Import
3. **Admin** sets a picks lock time
4. **Players** go to `/`, enter name + PIN → redirected to `/picks`
5. **Players** scroll through categories, tap to select predictions
6. Picks auto-lock at the configured time
7. **Admin** opens `/admin/live` during the ceremony
8. **Admin** taps nominees to mark winners as they're announced
9. **Everyone** watches `/leaderboard` update in real-time
10. Emoji reactions fly across the screen

## Project Structure

```
packages/
├── shared/     # Zod schemas, types, constants, scoring logic
├── server/     # Hono API, Drizzle/SQLite, Socket.io, Wikipedia parser
└── web/        # Vite + React 19 + React Router v7 SPA
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_PATH` | SQLite database file path | `bignight.db` |
| `JWT_SECRET` | Secret for signing JWT tokens | `bignight-dev-secret-change-in-prod` |
| `ADMIN_PIN` | PIN for admin access | (required) |
