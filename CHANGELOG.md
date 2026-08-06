# Changelog

All notable changes to this project will be documented in this file.

## [1.17.0] - 2026-08-06

### Added & Enhanced
- **Database Schema Sync & Master Admin Takeover (`src/lib/supabase.ts` / `AdminView.tsx` / `schema.sql`)**: Enforced full PostgreSQL `public.profiles` database schema synchronization (storing `pin`, `is_locked`, `role`, and targets) for all saved user profiles. Built Master Admin control capabilities in `AdminView.tsx` enabling Admin ("Aditya") to reveal/hide any user's PIN, reset PINs, toggle locks, execute instant Admin profile takeover, and trigger batch schema sync to Supabase.
- **Instant Profile Re-locking on Profile Change (`AppContext.tsx`)**: Resolved session token leak where unlocking one profile previously persisted global access across all profiles. Wiped session unlock tokens upon profile change so switching away from any locked profile (e.g. "Snehal") and switching back strictly forces entering that profile's PIN again.
- **Developer Settings Lock Isolation (`AdminAuthModal.tsx` / `Header.tsx` / `DeveloperModal.tsx`)**: Removed persistent `vitalsguard_admin_authed` token leaks. Added `isMasterOnly={true}` mode for Developer Settings authentication so launching Developer Settings always requires entering the Admin Passcode without leaving lingering tokens.
- **Mandatory PIN Switch Interception (`Header.tsx` / `ProfileModal.tsx` / `AdminView.tsx`)**: Enforced mandatory PIN authentication whenever switching to a locked profile from the header dropdown, multi-user management modal (`ProfileModal`), or admin security hub (`AdminView`).
- **Family Hydration Board Strict Confidentiality (`WaterTracker.tsx`)**: Ensured non-active locked profiles strictly display `🔒` status on family boards and conceal private intake metrics.

## [1.16.0] - 2026-08-06

### Added & Enhanced
- **Per-Profile PIN Management (`ChangePinModal.tsx`)**: Enabled each user profile (e.g. "Jyoti", "Aditya", etc.) to maintain a custom PIN (defaulting to `"1234"`). Created a sleek glassmorphic modal and quick action button (`🔑 Change PIN`) in the top navigation header for users to update their PIN cleanly with instant verification and feedback.
- **Dynamic Profile Lock (🔒) / Unlock (🔓) Toggle**: Added a single-click quick toggle button (`header-toggle-lock-btn`) and selector in profile managers allowing users to lock or unlock their profile privacy status anytime.
- **Privacy Lock Gate & PIN Auth Upgrade (`PrivacyLockGate.tsx` / `AdminAuthModal.tsx`)**: Updated authentication gates to accept either the specific user's PIN or the master Admin passcode.
- **Resilient Dual-Storage PIN Sync (`src/lib/supabase.ts`)**: Integrated 3-layer hybrid PIN map (`vitalsguard_profile_pins_map`) ensuring PIN configurations persist seamlessly across LocalStorage and Supabase PostgreSQL `profiles` table.

## [1.15.1] - 2026-08-06

### Fixed & Enhanced (RCA Resolution)
- **Profile Lock Persistence Engine Fix**: Resolved root cause where Supabase database fetches returning `null` for unmigrated `is_locked` columns were overwriting local lock states. Implemented a 3-layer hybrid lock map (`vitalsguard_locked_profiles_map`) in `src/lib/supabase.ts` ensuring lock/unlock states remain 100% persistent across network syncs and page refreshes.

## [1.15.0] - 2026-08-06

### Added & Enhanced
- **Profile Privacy Lock Gate (`PrivacyLockGate.tsx`)**: Created high-security lock screen overlay blocking all vitals readings, pill counts, medication lists, and water logs when an active profile is locked and unauthenticated.
- **Top KPI Cards & Family Board Data Masking**: Concealed health metrics behind `🔒 Profile Locked` indicators on overview cards and cross-profile family hydration boards for locked profiles.
- **Instant Cache-First Refresh (< 50ms)**: Synchronously initialized React state from LocalStorage cache on component mount, enabling instant page rendering with zero delay.
- **Parallel Background Sync**: Replaced serial network waterfalls with `Promise.allSettled()` parallel Supabase sync queries, eliminating 7-8s loading delays.
- **Admin Supabase Persistence**: Ensured profile roles (`Admin`, `Parent`, `Member`) and lock states (`is_locked`) are stored in Supabase `public.profiles` PostgreSQL table.

## [1.14.0] - 2026-08-06

### Added & Enhanced
- **Profile-Level Locking Mechanism**: Added `isLocked` state to `UserProfile` model and PostgreSQL `profiles` table (`is_locked` column). Lock (🔒) / Unlock (🔓) visual indicators rendered next to all profile options in selectors, profile cards, and modal lists.
- **Passcode Protection**: Enforced passcode verification when switching to a locked profile or toggling lock status.
- **"Aditya"-Exclusive "Admin" Navigation Tab**: Removed `+ Users` button from the top header and introduced a dedicated **"Admin"** tab in `Navigation.tsx` (Desktop & Mobile), which is **only visible** when the active profile is **"Aditya"**.
- **Admin Hub View (`AdminView.tsx`)**: Created `AdminView.tsx` component allowing Aditya to manage user profiles, toggle profile privacy locks, edit target goals, and launch the Developer Settings Hub.

## [1.13.0] - 2026-08-06

### Added & Enhanced
- **Hierarchical User Water Storage**: Implemented user-level `WaterItem` hydration containers (`UserProfile` → `WaterItem` → `WaterLog`) synced to `public.water_items` PostgreSQL table and LocalStorage (`vitalsguard_water_items_v1`).
- **Custom Water Containers Management**: Added interactive container creator in `WaterTracker.tsx` allowing each user profile to create and manage custom hydration items (e.g. *Hydro Flask 600ml*, *Morning Glass 250ml*).
- **Custom Date & Time Backdating**: Integrated date picker (`YYYY-MM-DD`) and time picker (`HH:MM`) in `WaterTracker.tsx` and `AppContext.tsx` allowing users to log past water records accurately for any date.
- **Single Dynamic Filled Glass Container UI for Past Days**: Each past day in the history list is rendered as a single glass SVG filled with liquid percentage (`0%` to `100%+`) reflecting exact daily goal progress, with an expandable log details view.
- **Local Development Protocol**: Updated `AGENTS.md` requiring all changes and features to be developed and verified locally first.

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
