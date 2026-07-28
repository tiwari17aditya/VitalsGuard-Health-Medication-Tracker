# 📜 VitalsGuard — Version History & Developer Changelog

All notable changes, bug fixes, features, security enhancements, and architectural upgrades for **VitalsGuard Health & Medication Tracker** are documented in this file.

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (`MAJOR.MINOR.PATCH`).

---

## 🚀 [v1.4.0] — 2026-07-28 (Doctor Timestamps & Custom Time Pickers)

### 🌟 Added
- **Exact Doctor Timestamps**:
  - Automatically captures real-time clock timestamp (`08:30 AM`) for every logged dose, blood glucose reading, and blood pressure measurement.
  - Added formatted timestamp displays across Medication Cards (`Last Taken: Today at 8:30 AM`), Schedule Calendar (`✅ Taken at 8:30 AM`), and Vitals History tables.
- **Interactive Intake Time Pickers (`<input type="time">`)**:
  - Added time selector inputs in `MedicationTracker.tsx` and `VitalsTracker.tsx` allowing users to log doses taken earlier at custom times (e.g. `07:15 AM`).
- **Doctor Export Timestamps**:
  - Included exact intake timestamps in exported CSV files and formatted HTML tabular emails dispatched to doctors/caretakers.

---

## 🔒 [v1.3.0] — 2026-07-28 (User Profile Security & Central Config Passcode)

### 🌟 Added
- **Passcode Protected Profile Management**:
  - Added passcode authorization gate (`AdminAuthModal.tsx`) to **"+ Add New Family User"** and **"Delete User"** actions in `ProfileModal.tsx`.
- **Central Security Configuration**:
  - Centralized security passcodes in [`src/config/app.config.ts`](file:///d:/Antigravity-Projects/Medication%20Tracker/src/config/app.config.ts) under `APP_CONFIG.security.adminPasscode`.
  - Passcode is configurable directly in `app.config.ts` or editable via Developer Settings.

---

## 🎨 [v1.2.0] — 2026-07-28 (UI Polish, Badge Overflow & Profile-Scoped Warnings)

### 🛠️ Fixed
- **Pill Adherence Badge Overflow**:
  - Fixed `100%` badge text overflowing the green box in `App.tsx` by setting flexible bounds (`minWidth: 60px`, `padding: 0 10px`, `whiteSpace: nowrap`).
  - Fixed adherence calculation displaying `100%` when a user profile has 0 medications (now accurately displays `0%`).
- **Profile-Scoped Low Stock Warnings**:
  - Fixed `⚠️ 2 Low Stock` warning badge displaying on user profiles with 0 medications by scoping `lowStockMeds` in `AppContext.tsx` to `activeProfile?.id`.

### 🌟 Refactored
- **Unified Developer Settings Hub**:
  - Consolidated header buttons into a single clean **`Developer Settings`** button (`Header.tsx`).
  - Created `DeveloperModal.tsx` containing tabs for Tech Stack, Cloud Database Keys, Central Config, and Security Management.

---

## 📧 [v1.1.0] — 2026-07-28 (Admin Security Gate & HTML Tabular Caretaker Emails)

### 🌟 Added
- **Admin Security Passcode Gate**:
  - Implemented session passcode authentication (`AdminAuthModal.tsx`) protecting Tech Stack and System Config settings.
- **Strict Email Format Validation**:
  - Added regex email format validator (`isValidEmail`) displaying real-time `✓ Valid Email Format` or `✕ Invalid Email Format` badges.
- **Rich HTML Tabular Email Reports**:
  - Built HTML email template generator (`generateTabularReportHTML`) formatting prescriptions, blood glucose, and blood pressure into structured HTML tables.
  - Added in-browser **HTML Email Preview Modal** (`ReportsManager.tsx`).

---

## 🐞 [v1.0.1] — 2026-07-28 (Supabase Empty Table Auto-Seeding & Loading Fix)

### 🛠️ Fixed
- **Infinite Profile Loading Spinner Lock**:
  - Fixed frontend freeze on `"Loading Profile Records..."` when connecting to empty Supabase cloud database tables.
  - Implemented auto-seeding logic in `src/lib/supabase.ts` to automatically populate default family profiles (`Mom` & `Dad`) and prescriptions upon connecting to empty tables.

---

## 🎉 [v1.0.0] — 2026-07-28 (Initial Core Release)

### 🌟 Added
- **Core SPA Architecture**: React 18, Vite 5, TypeScript, Vanilla CSS Design System with Glassmorphism aesthetics.
- **Single Central Config (`src/config/app.config.ts`)**: Central repository for medical standards, defaults, feature flags, and UI parameters.
- **Dual Storage Engine (`src/lib/supabase.ts`)**: Supabase PostgreSQL cloud integration with automated LocalStorage fallback.
- **PWA Capability**: Configured Service Worker and Web App Manifest for mobile installation (`vite-plugin-pwa`).
- **Vitals & Inventory Management**:
  - Diabetes Blood Glucose Tracker with ADA Medical Standard Classifications.
  - Blood Pressure (BP) Logger with ACC/AHA Standards and Hypertensive Crisis Alerts.
  - Smart Pill Inventory with auto-subtraction on dose intake and low-stock alerts.
  - Multi-User Profile Manager (Mom, Dad, Caretaker).
- **CI/CD Pipelines**: GitHub Actions workflow for automated deployment to GitHub Pages (`.github/workflows/deploy.yml`).
