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

### 3. Enhanced Profile-Level Water Logging System
- **Goal**: Upgrade the hydration tracker into an advanced, profile-isolated logging and management system with customizable container presets, dynamic intake suggestions, detailed timeline history, and hydration trends.
- **Rationale**: Water consumption needs vary significantly across family profiles based on age, weight, and seasonal weather. Profile-level water logging ensures separate target tracking, custom cup/bottle sizes per profile, and historical logging without profile data overlap.
- **Proposed Implementation**:
  - **Customizable Quick-Log Containers**: Allow each profile to define and customize quick-add preset container volumes (e.g., 150ml Tea Cup, 250ml Glass, 500ml Water Bottle, 750ml Sports Flask) saved per profile.
  - **Granular Intake Timeline & History**: Enhance `WaterLog` storage to support timestamps, container icons, notes (e.g., "Post-workout hydration"), and log edit/delete capabilities per profile.
  - **Smart Hydration Calculations & Nudges**: Integrate the scientific hydration algorithm (weight, season, age, gender) into profile-specific periodic intake nudges if intake falls below hourly target thresholds during waking hours.
  - **Profile Progress & Trend Analytics**: Provide day-by-day and weekly hydration progress charts per profile in the Family Hydration Board, highlighting hydration streaks and target achievement rates.
  - **Audit & Database Sync**: Record all profile water operations (`WATER_LOGGED`, `WATER_LOG_DELETED`, `WATER_TARGET_UPDATED`) to `ActionAuditLog` and sync seamlessly with PostgreSQL (`water_logs` table).

### 4. Profile Privacy Lock & Admin Security Management
- **Goal**: Introduce profile-level PIN/password protection for sensitive health profiles, centralized database credential storage, admin master override vault, and restricted visibility for diagnostic test profiles (`test_user`).
- **Rationale**: When multiple family members or caretakers share a single device dashboard, privacy and data protection are vital. Profile locks prevent unauthorized access or accidental edits to personal health data, while providing designated Admin users master access to manage credentials, change Admin passwords in real time, and inspect diagnostic test environments (`test_user`).
- **Proposed Implementation**:
  - **Profile Lock & Credentials Schema**:
    - Extend `UserProfile` in `src/types/index.ts` with `isLocked?: boolean`, `pinHash?: string`, `passwordHash?: string`, and `userRole` (`"admin"`, `"member"`, `"test"`).
    - Store and synchronize profile lock settings and hashed credentials in PostgreSQL (`profiles` table in Supabase).
  - **PIN Prompt & Session Security**:
    - Display a secure PIN/password verification modal when switching to a locked profile or the `Admin` profile from the header dropdown or multi-user management board.
    - Add interactive Password Protection toggle switches (`🔒 PIN Protected` / `🔓 Lock: OFF`) directly on profile cards in `ProfileModal.tsx`.
  - **Admin Security Dashboard & Password Management**:
    - Build a multi-tab Admin Dashboard (`AdminVaultModal.tsx`) allowing authenticated Admins to view PIN keys, reset passwords, update the master Admin password directly in PostgreSQL, edit caretaker email alerts, and view system action audit logs.
  - **Admin-Only Visibility for `test_user` & Admin Profiles**:
    - Register default `admin` and `test_user` profile entries in initial app state and database configurations.
    - Enforce strict UI filtering so `Admin` and `test_user` profiles are hidden from standard member views and visible **only** when authenticated under Admin mode.
