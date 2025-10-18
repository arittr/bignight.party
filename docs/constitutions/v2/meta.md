# Constitution v2

**Created**: 2025-01-18
**Previous**: v1 (2025-01-17)

## Summary

Adds Server/Client Component boundary patterns, inline server action wrappers, and admin authentication patterns. Documents patterns established during Game Database Admin feature implementation.

## Changes from v1

### Added

**Server/Client Component Boundaries** (patterns.md):
- Clear rules for when to use "use client" directive
- Event handler patterns (onClick, onChange must be in client components)
- Form action patterns (server actions work in Server Components)
- Reusable client component patterns for confirmations and filters

**Inline Server Action Wrapper Pattern** (patterns.md):
- Pattern for extracting FormData in inline server action wrappers
- Calling centralized next-safe-action actions from form actions
- Proper redirect handling after mutations
- Examples from admin dashboard implementation

**Admin Authentication** (architecture.md):
- ADMIN_EMAILS environment variable pattern
- JWT callback role assignment
- Middleware + layout authorization checks

**Linter Configuration** (patterns.md):
- Biome nursery rules for Next.js validation
- `noNextAsyncClientComponent` to catch async client components
- `noSecrets` to prevent credential leaks
- `useReactFunctionComponents` and `useExhaustiveSwitchCases`

**Examples from Production**:
- ConfirmDeleteButton reusable client component
- TypeFilter client component for works page
- Admin dashboard form handling patterns
- Hydration error fixes and resolution patterns

### Context

These patterns emerged from implementing tasks 1.1-7.7 of the Game Database Admin feature, plus fixes for hydration errors when the admin dashboard went live. The patterns solve real-world Next.js 15 Server/Client Component boundary violations and form handling requirements.

## Migration Guide

### For Existing Code

**If you have onClick/onChange in Server Components:**
```typescript
// Before (causes hydration error)
export default async function Page() {
  return <button onClick={() => alert('hi')}>Click</button>
}

// After (extract to client component)
// button.tsx
"use client"
export function ClickButton() {
  return <button onClick={() => alert('hi')}>Click</button>
}
```

**If you have nested forms:**
```typescript
// Before (causes HTML validation error)
<form action={updateAction}>
  <form action={deleteAction}>
    <button>Delete</button>
  </form>
</form>

// After (separate forms)
<form action={updateAction}>
  {/* update fields */}
</form>
<form action={deleteAction} className="mt-4">
  <button>Delete</button>
</form>
```

**Update Biome config:**
```json
{
  "linter": {
    "rules": {
      "nursery": {
        "noNextAsyncClientComponent": "error",
        "noSecrets": "error",
        "useReactFunctionComponents": "error",
        "useExhaustiveSwitchCases": "error"
      }
    }
  }
}
```

### No Breaking Changes

All v1 patterns remain valid. This version adds clarifications and new patterns for Next.js 15 Server/Client boundaries.

## Rationale

**Why create v2?**

1. **Server/Client boundaries are foundational**: These rules prevent runtime errors and hydration issues. They're as important as layer boundaries.

2. **Inline server action pattern is paradigmatic**: This pattern appears throughout the admin dashboard and follows Next.js 15 best practices. It needed documentation.

3. **Admin auth pattern is reusable**: The ADMIN_EMAILS pattern works for any role-based access control and should be documented.

4. **Real-world validation**: These patterns were tested under pressure (7 parallel implementation tasks + production testing). They work.

## Compliance

- [x] Constitution structure created (docs/constitutions/v2/)
- [x] All files updated with new patterns
- [x] Examples from production code
- [x] Migration guide provided
- [ ] Symlink updated to v2 (next step)
- [ ] Committed with git-spice (next step)

## Files in This Version

1. **meta.md** (this file) - Version 2 metadata and changelog
2. **architecture.md** - Layer boundaries, project structure, admin auth patterns
3. **patterns.md** - Mandatory patterns including Server/Client boundaries and inline actions
4. **tech-stack.md** - Approved libraries and versions (unchanged from v1)
5. **schema-rules.md** - Database design philosophy (unchanged from v1)
6. **testing.md** - TDD requirements (unchanged from v1)

## Future Versions

**When to create v3:**
- Breaking architectural changes (new layer, different boundaries)
- New mandatory patterns (deprecate old, add new)
- Major tech stack changes (Next.js 16, different ORM)
- Significant additions (new quality standards, security requirements)

**Don't version for:**
- Minor clarifications
- Example updates
- Typo fixes
- Non-breaking additions to existing sections
