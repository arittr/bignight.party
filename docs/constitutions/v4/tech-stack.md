# Tech Stack

## Frontend

### Next.js 15
- **Purpose**: React framework with App Router
- **Features**: React Server Components, Server Actions, Route Groups
- **Why**: Best-in-class DX, performance, and deployment story
- **Version**: 15.x (latest stable)

### React 19
- **Purpose**: UI library
- **Features**: Server Components, Actions, use() hook
- **Why**: Latest features, forward compatibility
- **Version**: 19.x

### TypeScript 5
- **Purpose**: Type-safe JavaScript
- **Features**: Strict mode, exhaustive checking
- **Why**: Catch errors at compile time, better DX
- **Version**: 5.x
- **Config**: Strict mode enabled

### Tailwind CSS v4
- **Purpose**: Utility-first styling
- **Features**: JIT compiler, custom design system
- **Why**: Fast, maintainable, consistent styling
- **Version**: 4.x

### shadcn/ui
- **Purpose**: Accessible component primitives
- **Features**: Built on Radix UI, customizable, copy-paste components
- **Why**: Consistent styling, built-in accessibility, no runtime dependencies
- **Installation**: `pnpm dlx shadcn@latest add [component]`
- **Components**: Card, Button, Badge, ScrollArea, Separator, Alert, etc.
- **Usage**: Foundation for feature components (see patterns.md)

### lucide-react
- **Purpose**: Icon library
- **Features**: Tree-shakeable, consistent design
- **Why**: Works seamlessly with shadcn/ui, large icon set
- **Usage**: Import specific icons as needed

---

## Backend

### oRPC (Open RPC)
- **Purpose**: Contract-first type-safe API framework
- **Packages**: `@orpc/server`, `@orpc/client`, `@orpc/client/fetch`, `@orpc/contract`, `@orpc/tanstack-query`
- **When**: ALL remote procedure calls (mandatory)
- **Why**: Type-safe end-to-end, OpenRPC standard, contract validation, full type inference, no serialization overhead
- **Version**: Latest stable
- **Pattern** (MANDATORY):
  - Define contracts with `oc.input().output()` from `@orpc/contract`
  - Implement routers with `implement(contract)` from `@orpc/server`
  - Client uses `RPCLink` (not `LinkFetchClient`/`StandardRPCLink`)
  - TanStack Query via `createTanstackQueryUtils(baseClient)`
  - Client Components: `useMutation(orpc.domain.proc.mutationOptions())`
- **Usage**:
  - Contracts: `src/lib/api/contracts/` - Define input/output schemas
  - Routers: `src/lib/api/routers/` - Implement with `implement(contract)`
  - Server Components: `serverClient` from `@/lib/api/server-client` (no HTTP)
  - Client Components: `orpc` from `@/lib/api/client` (with React Query)
- **See**: patterns.md for complete implementation guide

### Next.js API Routes
- **Purpose**: oRPC procedure handler endpoint
- **When**: Single handler for all RPC calls at `/api/rpc`
- **Why**: Centralized API gateway for all procedures

### Prisma
- **Purpose**: Type-safe ORM
- **Features**: Migrations, type generation, query builder
- **Why**: Type safety, great DX, PostgreSQL support
- **Version**: Latest stable
- **Usage**: ONLY in `src/lib/models/` layer

### Auth.js v5
- **Purpose**: Authentication
- **Features**: Magic link provider, session management
- **Why**: Built-in Prisma adapter, industry standard
- **Version**: 5.x (beta)

### Socket.io
- **Purpose**: Real-time WebSocket communication
- **Features**: Rooms, automatic reconnection, fallback
- **Why**: Reliable real-time, great browser support
- **Version**: Latest stable

---

## Data & Validation

### Zod
- **Purpose**: Runtime validation and type inference
- **When**: All input validation, contract definition
- **Why**: Type-safe validation, excellent DX
- **Version**: Latest stable
- **Location**: oRPC contracts in `src/lib/api/contracts/`, Zod schemas in `src/schemas/`

### ts-pattern
- **Purpose**: Exhaustive pattern matching
- **When**: ALL discriminated unions (mandatory)
- **Why**: Compiler-enforced exhaustiveness, type narrowing
- **Version**: Latest stable
- **See**: patterns.md for usage

---

## Infrastructure

### PostgreSQL
- **Purpose**: Relational database
- **Local**: Docker container
- **Production**: Neon serverless Postgres
- **Why**: ACID compliance, JSON support, performance
- **Version**: 15+

### Resend
- **Purpose**: Transactional email delivery
- **Features**: Magic link emails, templates
- **Why**: Developer-friendly API, reliable delivery
- **Version**: Latest API

### Vercel
- **Purpose**: Hosting and deployment
- **Features**: Serverless functions, edge network, preview deployments
- **Why**: Best Next.js support, zero config
- **Plan**: Hobby (free) or Pro

---

## Development Tools

### Biome
- **Purpose**: Fast linter and formatter
- **Features**: TypeScript-first, fast, configurable
- **Why**: Replaces ESLint + Prettier, much faster
- **Version**: Latest stable
- **Config**: Strict mode, no `any` types

### Husky
- **Purpose**: Git hooks
- **Features**: Pre-commit linting, pre-push tests
- **Why**: Enforce quality before commit
- **Version**: Latest stable

### pnpm
- **Purpose**: Package manager
- **Features**: Fast, disk-efficient, strict
- **Why**: Faster than npm/yarn, better monorepo support
- **Version**: 8.x+

---

## Testing (Future)

### Vitest
- **Purpose**: Unit and integration testing
- **Features**: Fast, Vite-powered, TypeScript support
- **Why**: Better than Jest for modern projects
- **Status**: Not yet implemented

### Playwright
- **Purpose**: End-to-end testing
- **Features**: Cross-browser, reliable, debuggable
- **Why**: Industry standard for E2E
- **Status**: Not yet implemented

---

## Prohibited Libraries

These libraries are **explicitly forbidden**:

### ❌ Mongoose
- **Why**: We use Prisma for type safety
- **Use instead**: Prisma

### ❌ Express
- **Why**: Next.js API routes with oRPC provide everything we need
- **Use instead**: Next.js API Routes / oRPC procedures

### ❌ Axios
- **Why**: Native fetch is sufficient and built-in
- **Use instead**: `fetch()` API

### ❌ Lodash
- **Why**: Modern JavaScript has most utilities built-in
- **Use instead**: Native array methods, `Object` methods

### ❌ Moment.js
- **Why**: Unmaintained, heavy, use modern alternative
- **Use instead**: `date-fns` or native `Temporal` (when stable)

### ❌ Redux / Zustand / Jotai
- **Why**: React Server Components + URL state is sufficient
- **Use instead**: Server Components, `useState`, URL params

---

## Adding New Dependencies

### Evaluation Criteria

Before adding a new dependency, verify:

1. **Necessity**: Can't be done with existing tools?
2. **Maintenance**: Actively maintained? Last commit recent?
3. **Size**: Bundle impact acceptable?
4. **TypeScript**: First-class TS support?
5. **Community**: Popular, well-documented?
6. **Alternatives**: Compared other options?

### Approval Process

1. Document rationale in GitHub issue
2. Compare alternatives with pros/cons
3. Team review and discussion
4. Update this constitution if approved
5. Add to package.json with fixed version

### Example Format

```markdown
## Proposal: Add `library-name`

**Problem**: [What problem does this solve?]

**Alternatives Considered**:
- Option A: [Why not this?]
- Option B: [Why not this?]

**Why This Library**:
- [Reason 1]
- [Reason 2]

**Bundle Impact**: +X KB gzipped

**Maintenance**: Last commit [date], [contributors] contributors

**Decision**: [Approved/Rejected]
```

---

## Version Management

### Updating Dependencies

**Patch updates**: Automatic (Dependabot)
**Minor updates**: Review changelog, test, merge
**Major updates**: Full testing, migration plan, team review

### Lock File

**Always commit**: `pnpm-lock.yaml`
**Why**: Ensure reproducible builds
**Update**: `pnpm update` after approval

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=random-secret  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://bignight.party

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=game@bignight.party

# Admin
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### Local Development

Use `.env.local` (gitignored):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bignight
NEXTAUTH_URL=http://localhost:3000
```

### Production

Set in Vercel dashboard, never commit to repo.

---

## Package.json Standards

### Script Naming

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

### Version Pinning

- Use exact versions for critical dependencies
- Use `^` for development tools
- Lock major versions for stability

```json
{
  "dependencies": {
    "next": "15.0.0",        // Exact
    "prisma": "^5.0.0"       // Allow minor updates
  }
}
```

---

## IDE Configuration

### VS Code (Recommended)

Extensions:
- Biome
- Prisma
- Tailwind CSS IntelliSense

Settings:
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit"
  }
}
```

### TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```
