# Phase 2: Authentication Layer

**Strategy**: Sequential (single task)
**Dependencies**: Phase 1 (requires database schema)
**Estimated Time**: 7 hours

---

## Task 2: Better-Auth Integration

**Complexity**: L (6-7h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/lib/auth/config.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/auth/client.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/auth/session.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/context.ts`
- `/Users/drewritter/projects/bignight.party-vite/.env.example`
- `/Users/drewritter/projects/bignight.party-vite/package.json`

**Dependencies**: Task 1 (Database Schema)

**Dependency Reason**: Better-Auth requires Prisma schema with User, Account, and VerificationToken models (already in schema from Task 1).

**Description**:
Set up Better-Auth with magic link authentication and admin role assignment. Integrate with oRPC context to provide authenticated sessions for all API calls. Replace Auth.js patterns with Better-Auth (no Edge runtime constraints, direct database access allowed).

**Implementation Steps**:

1. Install dependencies:
   ```bash
   cd /Users/drewritter/projects/bignight.party-vite
   bun add better-auth resend
   ```

2. Create Better-Auth config (`src/lib/auth/config.ts`):
   - Import `betterAuth`, `prismaAdapter`, `magicLink` plugin
   - Configure database adapter with Prisma
   - Set up magic link plugin with Resend email sender
   - Add `onCreate` hook for admin role assignment via `ADMIN_EMAILS` env var
   - Export auth instance

3. Create auth client (`src/lib/auth/client.ts`):
   - Export client-side Better-Auth hooks
   - `useSession()`, `signIn()`, `signOut()` functions

4. Create session utilities (`src/lib/auth/session.ts`):
   - `getSession()` - Server-side session retrieval
   - `requireSession()` - Throws if no session
   - `requireAdmin()` - Throws if not admin role

5. Update oRPC context (`src/orpc/context.ts`):
   - Add Better-Auth session to context
   - Include `user`, `userId`, `role` in context type
   - Handle unauthenticated requests gracefully

6. Update `.env.example`:
   ```bash
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=http://localhost:3000
   RESEND_API_KEY=
   EMAIL_FROM=
   ADMIN_EMAILS=
   ```

7. Test authentication flow:
   - Request magic link
   - Verify email sent via Resend
   - Click link and verify session created
   - Verify admin role assigned for emails in `ADMIN_EMAILS`

**Acceptance Criteria**:
- [ ] `better-auth` and `resend` packages installed
- [ ] Auth config creates valid Better-Auth instance
- [ ] Magic link email sends successfully via Resend
- [ ] User can sign in via magic link
- [ ] Session persists in database (check `Session` table)
- [ ] Admin role assigned when email in `ADMIN_EMAILS`
- [ ] oRPC context includes authenticated user data
- [ ] `requireSession()` throws for unauthenticated requests

**Mandatory Patterns**:

> **Better-Auth vs Auth.js**:
> - No Edge runtime constraints - can query database anywhere
> - Admin role stored in database (not JWT)
> - Session validation doesn't require middleware workarounds

**Key Integration Points**:
- Prisma adapter connects to existing User/Account models
- oRPC context provides session to all procedures
- Magic link template can reuse existing Resend patterns

**Quality Gates**:
```bash
bun run lint
bun run check-types
# Manual testing: Request magic link, verify email, sign in
```

**Reference**:
- Spec section: "Better-Auth Configuration" (lines 353-397)
- Better-Auth docs: https://www.better-auth.com/docs
