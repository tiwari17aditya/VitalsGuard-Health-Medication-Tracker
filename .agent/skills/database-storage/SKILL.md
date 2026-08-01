---
name: database-storage
description: Guidelines for database schema, Supabase client integration, offline local storage fallback, and zero-data-loss safety rules.
---

# Database & Storage Skill

## Scope & Applicability
Applies when working on `src/lib/supabase.ts`, `Utility/supabase/schema.sql`, database migrations, local storage sync, or persistent data models.

## Core Rules & Constraints
- **CRITICAL DATA SAFETY**: NEVER delete user data directly from the database or local storage under any circumstances. Always preserve user profiles, logs, and vitals records.
- **Type Safety**: Enforce explicit TypeScript interfaces when querying Supabase tables.
- **Schema Alignment**: Any SQL changes must be reflected in `Utility/supabase/schema.sql` and mirrored in client type declarations.
- **Offline Resiliency**: Maintain local storage fallback wrappers so the application remains functional even when disconnected from Supabase.

## Verification Checklist
- [ ] Confirmed zero destructive `DELETE` / `DROP` queries without soft-delete or data preservation handling.
- [ ] Verified Supabase calls are safely wrapped in try-catch error handlers.
- [ ] Verified local storage persistence syncs with application context state.
