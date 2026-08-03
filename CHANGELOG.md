# Changelog

All notable changes to this project will be documented in this file.

## [1.13.0] - 2026-08-03

### Added
- **Water Tracking Database Sync & Multi-Device Persistence Roadmap**: Added technical specification to `Research/ENHANCEMENTS.md` for PostgreSQL schema mapping (`water_logs` table), Supabase adapter methods (`fetchWaterLogs`, `saveWaterLogDB`, `deleteWaterLogDB`), and offline queue syncing.
- **Email Pipeline, CSV Attachment Formatting & Messaging System Bug Fixes Roadmap**: Added technical specification to `Research/ENHANCEMENTS.md` covering CSV export sanitization (`\uFEFF` UTF-8 BOM, comma escaping, clean headers), styled HTML email templates in `api/send-email.js`, and Nodemailer serverless error handling.
- **Profile-Level Automatic Reminders, Water Logging & Privacy Lock Proposals**: Recorded feature proposals for automated multi-channel medication alerts, customizable quick-add hydration containers, profile PIN locks, and Admin master vault security in `Research/ENHANCEMENTS.md`.

## [1.12.0] - 2026-08-01

### Added
- **Antigravity Hierarchical Skills Migration**: Migrated workspace rules architecture to the Antigravity Hierarchical Skills Standard to reduce prompt token overhead and prevent context stuffing.
- **Root Router (`AGENTS.md`)**: Implemented a lightweight routing table (< 30 lines) at the root of the workspace mapping file extensions and tasks to active domain skills.
- **Domain Skills (`.agents/skills/`)**: Created modular, token-optimized skill definitions for `database-storage`, `ui-components`, `api-services`, `quality-deployment`, and `release-git-docs`.
- **Legacy Backup**: Preserved original monolithic rules in `.agents/AGENTS.md` as a backup.

## [1.11.2] - 2026-07-31

### Added & Fixed
- **Resilient Database Upsert Retry**: Implemented automatic fallback retry in `saveProfileDB` to gracefully handle PostgREST schema cache misses (`PGRST204`), ensuring profile creation succeeds even if optional columns are absent in remote PostgreSQL tables.
- **Sample Profile Cleanup**: Removed out-of-the-box sample profiles (`Mom (Sarah)` and `Dad (James)`) and their sample medications from default app configurations and launch cleanup routines, leaving only real user profiles active.
- **Null-Safe Component Guarding**: Added safe optional checking for `currentProfile` and `activeProfile` across `App.tsx` and `AppContext.tsx` to prevent blank screen render crashes on empty profile states.
- **Data Preservation Rule**: Added permanent rule in `.agents/AGENTS.md` strictly prohibiting any automatic or direct deletion of user records.

## [1.11.0] - 2026-07-31

### Added
- **Scientific Hydration Target Calculator**: Introduced an automated calculator that dynamically determines daily water targets using user gender, weight, season, and age.
- **Dynamic Profile Metrics**: Added input selectors for Gender, Weight (kg), and Current Season in the profile manager modal, saving these values in PostgreSQL.
- **Auto-Calculate Toggle UI**: Added an "Auto-Calculate" checkbox in the profile modal that locks and updates the water intake input field dynamically, supporting custom overrides when unchecked.

## [1.10.2] - 2026-07-31

### Added
- **Water Target database storage**: Synced the water tracker daily targets directly to PostgreSQL under the new `target_water` column in the `profiles` table.
- **Caretaker Email database storage**: Saved the caretaker email to the database under the `"system-settings"` profile's `emergencyContact` column, enabling dynamic multi-device synchronization.
- **Goals and targets UI editor**: Added input fields for `Daily Water Goal` and `Target Glucose (Post-Meal)` in the user profile modal so that all goals are fully customizable in the UI.

## [1.10.1] - 2026-07-31

### Fixed
- **Strict Database Error Handling**: Added explicit checks on returned Supabase response errors to correctly trigger the LocalStorage fallback flow instead of failing silently.
- **Dynamic Connection Status Badge**: Replaced static build-time connection check with a dynamic connection check that periodically checks real-time database accessibility.
- **Auto-Sync for Local Storage**: Added automatic synchronization on startup and network restoration to upload offline/locally-stored medications, logs, and vitals to Supabase.
- **Auto-Polling Sync**: Added 30-second background polling (throttled by tab visibility) to keep multiple devices viewing the same active profiles in sync.

## [1.10.0] - 2026-07-31

### Added
- **Water Intake Tracker**: Implemented a comprehensive water tracking system supporting multi-profile daily target goals, logged hydration history, and hydration streak awards.
- **Fluid Wave SVG Animation**: Integrated a high-fidelity animated SVG glass mockup reflecting live hydration completion percentage with animated water ripples and waves.
- **Family Hydration Board**: Added a shared comparative overview board allowing parents and kids to keep each other updated on their daily consumption and water intake averages.
- **Supabase Integration & Fallback**: Configured sync support for a new Postgres database table `water_logs` in the Supabase schema, including fallback storage handlers to ensure offline/local-only configurations function perfectly.

## [1.9.1] - 2026-07-31

### Fixed
- **Database Deletion Sync**: Solved issue where deleted medication and profile records persisted in the database after being removed from the UI.
- **Cascade Deletes**: Configured manual cascading deletes in the Supabase adapter to ensure associated records (logs, medications, BP and glucose readings) are correctly removed first, avoiding database foreign-key constraint violations.
- **Error Handling**: Enabled throwing of database query errors to prevent UI/localStorage local state from updating if a Supabase remote operation fails.
- **Medication Log Database Deletion**: Implemented `deleteMedicationLogDB` to support deleting medication intake logs directly in the Supabase database.
