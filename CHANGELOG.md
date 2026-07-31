# Changelog

All notable changes to this project will be documented in this file.

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
