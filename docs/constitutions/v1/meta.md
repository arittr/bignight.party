# Constitution v1

**Created**: 2025-01-17
**Previous**: Initial version

## Summary

Initial constitution extracted from specs/mvp-planning/. Formalizes mandatory patterns, architecture rules, and tech stack for BigNight.Party.

## Changes from specs/mvp-planning

### Structure
- Converted planning docs to versioned constitution
- Split into modular files (architecture, patterns, tech-stack, schema-rules, testing)
- Added testing standards (TDD requirement)
- Created docs/constitutions/ for versioned governance

### Formalized
- Layer boundaries (Models → Services → Actions → UI)
- Mandatory patterns (next-safe-action, ts-pattern)
- Tech stack decisions (Next.js 15, Prisma, Auth.js v5, Socket.io)
- Schema design principles (Event/Game separation, point values on Category)
- Testing standards (TDD via test-driven-development skill)

### What's Constitutional
- ✅ Architectural rules and principles
- ✅ Mandatory patterns and libraries
- ✅ Tech stack and approved tools
- ✅ Database design philosophy
- ✅ Layer boundaries and responsibilities
- ✅ Code quality standards

### What's NOT Constitutional
- ❌ Actual Prisma schema (lives in `prisma/schema.prisma`)
- ❌ Specific implementations (those are in code)
- ❌ Planning artifacts (stay in `specs/`)
- ❌ Feature specs (stay in `specs/features/`)

## Migration Guide

No code changes required. This formalizes existing patterns already in use.

**References updated:**
- Commands: `@specs/mvp-planning/patterns.md` → `@docs/constitutions/current/patterns.md`
- Skills: `@specs/mvp-planning/architecture.md` → `@docs/constitutions/current/architecture.md`
- Commands: `@specs/mvp-planning/database-schema.md` → `@docs/constitutions/current/schema-rules.md`

**Actual schema location:**
- Prisma schema lives at: `prisma/schema.prisma`
- Constitution contains design *rules*, not schema *definition*

## Rationale

Creating versioned constitutions enables:
1. **Clear evolution** of architectural decisions over time
2. **Ability to reference** specific rule versions
3. **Audit trail** for pattern changes and why they happened
4. **Easier onboarding** with single source of truth for "how we build"
5. **Separation of concerns** between foundational rules and planning artifacts

Separated from `specs/` to distinguish:
- **Constitution**: Eternal truths about how we build
- **Specs**: Temporal plans for what we're building

## Compliance

- [x] Constitution structure created (docs/constitutions/v1/)
- [ ] All commands updated to reference v1 (TODO)
- [ ] All skills updated to reference v1 (TODO)
- [ ] Existing code audited for compliance (TODO)
- [ ] Tests pass with new rules (TODO)

## Files in This Version

1. **meta.md** (this file) - Version metadata and changelog
2. **architecture.md** - Layer boundaries, project structure, design principles
3. **patterns.md** - Mandatory libraries (next-safe-action, ts-pattern) and prohibited patterns
4. **tech-stack.md** - Approved libraries, versions, usage guidelines
5. **schema-rules.md** - Database design philosophy, naming conventions, query patterns
6. **testing.md** - TDD requirements, test organization, coverage standards

## Future Versions

**When to create v2:**
- Breaking architectural changes (new layer, different boundaries)
- New mandatory patterns (deprecate old, add new)
- Major tech stack changes (Next.js 16, different ORM)
- Significant additions (new quality standards, security requirements)

**Don't version for:**
- Minor clarifications
- Example updates
- Typo fixes
- Non-breaking additions to existing sections
