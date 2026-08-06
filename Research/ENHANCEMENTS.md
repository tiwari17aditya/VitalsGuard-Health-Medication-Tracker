# Planned Enhancements & Feature Roadmap

This document records feature requests, UI/UX enhancements, and technical proposals planned for future releases.

## 🚀 Upcoming Feature Roadmap

### 1. Custom Profile Avatars & Photo Uploads
- **Goal**: Allow users to upload or select custom photos/avatars for each family member profile (e.g. photos of parents).
- **Rationale**: Enhances accessibility for elderly parents and caretakers by providing instant visual recognition when switching between user profiles.
- **Proposed Implementation**:
  - Add an optional `avatarUrl` / `avatarBase64` property to the `UserProfile` type in `src/types/index.ts`.
  - Add an image file picker input in `ProfileModal.tsx` allowing photo uploads.
  - Store photos in Supabase Storage buckets or compressed Base64 strings in PostgreSQL `profiles` table.
  - Render profile avatar images next to profile names in the top header selector dropdown and Multi-User Management modal cards.

### 2. Automatic Medication Reminders (Profile-Level)
- **Goal**: Provide automated, profile-specific medication alerts, audio chimes, browser push notifications, and email reminders tailored to each individual profile's scheduled dose times and contact preferences.
- **Rationale**: Caretakers managing multiple family profiles (e.g., elderly parents, kids, self) need profile-isolated notifications so that medication alerts specifically target the active profile or notify caretakers when background profile doses are due or overdue.
- **Proposed Implementation**:
  - **Profile Notification Settings**: Extend `UserProfile` in `src/types/index.ts` with properties such as `emailNotificationsEnabled`, `reminderLeadTimeMinutes`, `soundAlertsEnabled`, `quietHoursStart`, `quietHoursEnd`, and `caretakerEmail`.
  - **Background Schedule Engine**: Create a dedicated React hook (`useMedicationScheduler.ts`) or Web Worker that runs periodic schedule evaluations against all registered profiles in `AppContext`.
  - **Multi-Channel Dispatch**:
    - **In-App & Audio**: Display a high-visibility modal or toast with custom chime audio tailored to the specific profile when a scheduled dose time is reached.
    - **Browser Push**: Utilize the Browser Notification API to trigger native desktop/mobile OS notifications even when the tab is running in the background.
    - **Caretaker Email Dispatch**: Trigger email alerts via `api/send-email.js` (Nodemailer/Vercel serverless) when a dose remains unconfirmed past a configurable grace period (e.g., 30 minutes).
  - **Snooze & Adherence State**: Enable profile-level dose snoozing (15 min, 30 min, 1 hour) and automatic logging of missed doses to `MedicationLog` with action audit entries (`MEDICATION_SKIPPED` / `ACTION_AUDIT`).

### 3. Enhanced Profile-Level Water Logging System (Released in v1.13.0)
- **Status**: ✅ **Released in v1.13.0**
- **Highlights**:
  - **Hierarchical User Storage**: User-level `WaterItem` hydration containers (`UserProfile` → `WaterItem` → `WaterLog`) stored in `public.water_items` table and LocalStorage (`vitalsguard_water_items_v1`).
  - **Custom Water Containers Manager**: Interactive container builder in `WaterTracker.tsx` allowing each profile to manage custom container sizes (*Hydro Flask 600ml*, *Glass 250ml*, *Water Bottle 500ml*).
  - **Custom Date & Time Backdating**: Date picker (`YYYY-MM-DD`) and time picker (`HH:MM`) in `WaterTracker.tsx` and `AppContext.tsx` allowing users to accurately log past hydration records for any date.
  - **Single Dynamic Filled Glass Container UI**: Past days rendered as a single SVG glass container dynamically filled with liquid level percentage (`0%` to `100%+`) matching daily goal progress, with an expandable log breakdown.

### 4. Profile Privacy Lock & Admin Security Management (Released in v1.14.0)
- **Status**: ✅ **Released in v1.14.0**
- **Highlights**:
  - **Profile Lock Schema**: Added `isLocked?: boolean` to `UserProfile` and PostgreSQL `profiles` table (`is_locked` column).
  - **Lock Indicators**: Lock (🔒) / Unlock (🔓) visual badges displayed beside profile options in dropdown selectors and profile cards.
  - **Passcode Gate**: Passcode authentication (`AdminAuthModal`) enforced when switching to a locked profile or toggling lock status.
  - **Aditya-Exclusive Admin Tab**: Dedicated `"admin"` navigation tab (`AdminView.tsx`) restricted exclusively to profile "Aditya" for centralized user management and security administration.
  - **Per-Profile PIN & Password Change (v1.16.0)**: Individual PIN support (`profile.pin`, default `"1234"`), dedicated `ChangePinModal` for changing PINs, and dynamic lock/unlock visibility controls.
  - **Instant Inactive Profile Lock & Switch Enforcement (v1.17.0)**: Automatic revocation of session unlock tokens for inactive profiles in `AppContext.tsx`, mandatory PIN prompt on profile switch across Header, ProfileModal, and AdminView, and strict family board confidentiality.
  - **Database Schema Sync & Master Admin Control (v1.17.0)**: Complete PostgreSQL `public.profiles` database schema synchronization (storing `pin`, `is_locked`, `role`, and targets) for all saved user profiles. Master Admin control capabilities in `AdminView.tsx` enabling Admin ("Aditya") to reveal/hide PINs, reset PINs, toggle locks, execute instant Admin profile takeover, and trigger batch schema sync.
  - **Aditya-Exclusive Admin & Developer Controls + Profile Bar Header Hub (v1.17.0)**: Restricted Developer Settings button and Supabase Live status pill strictly to Aditya/Admin profile. Removed Admin tab from main navigation bar, relocated `🛡️ Admin Hub` button to the top header profile bar for Aditya, and enabled modal overlay launcher for Admin Control Center.
  - **PII Security & Cipher Encryption (v1.18.0)**: Encrypted all user PINs with `PII_ENC:...` ciphertext payloads in Supabase PostgreSQL and LocalStorage. Masked PINs as `••••` with `🔒 PII Sensitive` badge tag in UI, requiring Master Admin passcode authorization to reveal cleartext PINs.
  - **Strict Single-PIN Enforcement & Reset to Default (v1.18.0)**: Fixed dual-password bug by removing default `"1234"` fallback override in `verifyPIIPin`. Added `🔄 Reset PIN to Default (1234)` action button in `ChangePinModal.tsx` and `AdminView.tsx`.

### 8. Diabetes Date Selection, Calendar Vitals Timeline, Log Search & User Guide (Released in v1.18.0)
- **Status**: ✅ **Released in v1.18.0**
- **Highlights**:
  - **Blood Glucose Date Picker**: Added a custom `Record Date` date picker alongside Record Time in `VitalsTracker.tsx`, enabling users to log blood sugar readings for current and past dates.
  - **Unified Health Schedule Calendar**: Upgraded `MedicationCalendar.tsx` to display daily prescription adherence schedules, Blood Glucose logs, and Blood Pressure logs together under any selected date timeline with day ribbon indicators (`🩸` and `❤️`).
  - **Customizable Email Report Ranges & Log Search Dispatch**: Added report range radio options (Daily / Custom Date Range / All Time) and a search mechanism allowing users to search logs by date or keyword and email targeted reports specifically for those searched days.
  - **In-App User Guide & Documentation**: Created `UserGuideModal.tsx` categorized help guide and added a top header bar button (`📖 User Guide`) for instant access.

### 5. Water Tracking Database Persistence & Multi-Device Sync
- **Goal**: Track, save, and synchronize all profile water intake entries, daily hydration targets, and container logs directly in the PostgreSQL database with zero data loss.
- **Rationale**: Ensures hydration records are permanently stored in PostgreSQL (`water_logs` table in Supabase) rather than remaining localized to a single browser storage instance. Enables seamless hydration tracking sync across mobile phones, tablets, and desktop computers.
- **Proposed Implementation**:
  - **PostgreSQL Table Schema**: Ensure `public.water_logs` table definition in `Utility/supabase/schema.sql` contains `id`, `profile_id`, `amount_ml`, `timestamp`, `container_type`, `notes`, and foreign key constraints to `public.profiles`.
  - **Database Adapter Sync**: Expand `fetchWaterLogs()`, `saveWaterLogDB()`, and `deleteWaterLogDB()` in `src/lib/supabase.ts` to map columns between camelCase TypeScript models and snake_case PostgreSQL columns.
  - **Offline Storage Sync Engine**: Queue water log entries taken offline in LocalStorage (`vitalsguard_offline_water_logs`) and automatically flush to Supabase when network connectivity is restored.

### 6. Email Pipeline, CSV Attachment Formatting & Messaging System Bug Fixes
- **Goal**: Fix formatting bugs in daily caretaker email reports, enhance CSV attachment formatting for health logs (medications, BP, glucose, water), and improve serverless email delivery resilience.
- **Rationale**: Caretakers relying on emailed health digests need clean, error-free CSV exports that open seamlessly in Microsoft Excel/Google Sheets, formatted HTML tables with clear status badges, and reliable Nodemailer dispatch without serverless timeouts or formatting corruptions.
- **Proposed Implementation**:
  - **CSV Export Sanitization**:
    - Standardize CSV generation logic in `src/services/emailService.ts` to include clean column headers (`Timestamp`, `Profile Name`, `Log Type`, `Dosage / Reading / Intake`, `Status / Notes`).
    - Add UTF-8 BOM encoding (`\uFEFF`) to prevent character distortion in Excel.
    - Escape field commas, quotes, and line breaks to eliminate CSV parsing crashes.
  - **HTML Email Template Redesign**:
    - Replace basic plain text emails in `api/send-email.js` with responsive, styled HTML templates featuring VitalsGuard glassmorphic cards, colored alert pill badges, and summarized patient health stats.
  - **Serverless Bug Fixes & Resilience**:
    - Resolve bugs in `api/send-email.js` handling missing environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`), timeout retries, and invalid recipient email syntax.
    - Add structured JSON logger output for all Nodemailer transaction events and failure diagnostic tracebacks.

### 7. Automatic Developer & Admin Settings Project Version Synchronization
- **Goal**: Automatically synchronize project version numbers across `package.json`, `APP_CONFIG.meta.version` (`app.config.ts`), `DeveloperModal.tsx` version history, `README.md`, and `CHANGELOG.md` as development releases progress.
- **Rationale**: Ensures that whenever new feature additions or version bumps occur during development, Developer Settings and Admin Hub dynamically reflect live version identifiers, build metadata, and changelog releases without manual hardcoded discrepancy risks.
- **Proposed Implementation**:
  - Centralize `APP_CONFIG.meta.version` in `src/config/app.config.ts` and bind it directly to `package.json`.
  - Maintain synchronized `versionHistory` entries in `DeveloperModal.tsx` matching `CHANGELOG.md` and release commits.
  - Enforce version check verification as part of the `release-git-docs` task packup protocol.
