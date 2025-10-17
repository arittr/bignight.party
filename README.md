# BigNight.Party

A real-time prediction game for awards shows, starting with the Oscars. Compete with friends to see who can predict the most winners!

## What It Does

- 🎬 **Pick Your Winners** - Fill out predictions for each category via a guided wizard
- 🏆 **Live Scoring** - Watch the leaderboard update in real-time as winners are revealed
- 📊 **See the Stats** - View aggregate prediction percentages without seeing individual picks
- 🎉 **React Live** - Send emoji reactions during the ceremony that appear on the leaderboard
- 👤 **Magic Link Auth** - Sign in securely with just your email
- 🔐 **Admin Controls** - Manage categories, set point values, mark winners, and control reveals

## Tech Stack

- **Next.js 15** (App Router with Turbopack)
- **TypeScript** with strict linting (Biome)
- **Prisma** + PostgreSQL (Docker local / Neon production)
- **Auth.js v5** for magic link authentication
- **Socket.io** for real-time WebSocket updates
- **Resend** for email delivery
- **Tailwind CSS v4** for styling
- **next-safe-action** for type-safe server actions
- **ts-pattern** for exhaustive pattern matching

## Getting Started

```bash
# Install dependencies
pnpm install

# Start local PostgreSQL (Docker)
docker-compose up -d

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/
│   ├── actions/   # Server Actions
│   ├── auth/      # Auth.js configuration
│   ├── db/        # Prisma client
│   ├── models/    # Database access layer
│   ├── services/  # Business logic
│   └── websocket/ # Socket.io server
├── schemas/       # Zod validation schemas
└── types/         # TypeScript type definitions
```

## Documentation

See [specs/](./specs/) for detailed architecture and design documentation.

## Development

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Run database migrations
pnpm prisma migrate dev

# Open Prisma Studio
pnpm prisma studio

# Debug mode
pnpm dev:debug
```

## Deployment

Deploys to Vercel with Neon PostgreSQL database.
