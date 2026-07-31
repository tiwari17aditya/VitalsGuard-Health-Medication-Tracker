# Changelog

All notable changes to this project will be documented in this file.

## [1.9.1] - 2026-07-31

### Fixed
- **Database Deletion Sync**: Solved issue where deleted medication and profile records persisted in the database after being removed from the UI.
- **Cascade Deletes**: Configured manual cascading deletes in the Supabase adapter to ensure associated records (logs, medications, BP and glucose readings) are correctly removed first, avoiding database foreign-key constraint violations.
- **Error Handling**: Enabled throwing of database query errors to prevent UI/localStorage local state from updating if a Supabase remote operation fails.
- **Medication Log Database Deletion**: Implemented `deleteMedicationLogDB` to support deleting medication intake logs directly in the Supabase database.
