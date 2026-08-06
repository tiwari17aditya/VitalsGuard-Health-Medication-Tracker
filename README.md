# 🛡️ VitalsGuard — Diabetes, Blood Pressure & Medication Tracker

> A production-ready, open-source, 100% lifetime-free health tracking web application designed for elderly parents and caretakers. Built with React 18, Vite 5, TypeScript, Supabase PostgreSQL, PWA mobile capabilities, and Vercel cloud deployment.

**🌐 Live Demo:** [https://vitalsguard-health-medication-track](https://vitalsguard-health-medication-track.vercel.app/)

---

## 🌟 Key Features

- 👥 **Multi-User Profile Management**: Manage separate profiles for Mom, Dad, Caretakers with passcode authorization.
- 🩸 **Diabetes & Blood Sugar Tracking**: Log Fasting, Post-Meal, Bedtime readings with instant ADA medical standard classification (Normal, Pre-Diabetes, High).
- ❤️ **Blood Pressure (BP) Monitoring**: Record Systolic, Diastolic, Pulse with ACC/AHA categories (Normal, Elevated, Stage 1, Stage 2, Hypertensive Crisis alert).
- ⏰ **Doctor Timestamps & Custom Time Pickers**: Captures exact intake times (e.g. `08:30 AM`) and allows custom time entry for doctor compliance review.
- 💊 **Smart Pill Inventory (Add & Auto-Subtract)**: Track remaining pill count for each prescription. Intake button logs adherence and automatically subtracts 1 pill from inventory.
- 📧 **Caretaker HTML Email Reports**: Validated email address dispatch with HTML tables for medications, blood sugar, and blood pressure history.
- 🔒 **Developer Settings Hub**: Passcode protected developer management hub (`Default PIN: 1234`).
- ⚡ **Dual Engine (Supabase + LocalStorage)**: Connects to free Supabase PostgreSQL cloud DB with automatic offline LocalStorage fallback.

---

## 📜 Release Version History

Detailed release notes and developer changelogs are maintained in [**`CHANGELOG.md`**](file:///d:/Antigravity-Projects/Medication%20Tracker/CHANGELOG.md).

| Version | Release Date | Key Highlights |
| :--- | :--- | :--- |
| **`v1.14.0`** | 2026-08-06 | Profile-Level Locking Mechanism (🔒/🔓 icons, passcode gate) & "Aditya"-Exclusive "Admin" Navigation Tab |
| **`v1.13.0`** | 2026-08-06 | Hierarchical User Water Storage (`water_items` table), Custom Date & Time Backdating, and Single Dynamic Filled Water Glass Container UI for past days |
| **`v1.9.1`** | 2026-07-31 | Fixed database record deletion synchronization (cascade deletes for profiles, medications, and logs, correct Supabase error propagation) |
| **`v1.6.0`** | 2026-07-30 | Vercel cloud deployment setup, fail-safe client mailto fallback, updated SMTP configurations, PWA manifest icons fix, removed deprecated workflows, CarePulse to VitalsGuard refactoring |
| **`v1.5.0`** | 2026-07-28 | Mobile viewport optimization & mobile bottom glassmorphism navigation bar |
| **`v1.4.0`** | 2026-07-28 | Exact Doctor Timestamps, `<input type="time">` custom intake time pickers, timeline logs |
| **`v1.3.0`** | 2026-07-28 | Passcode protection for Adding/Deleting Users, central `APP_CONFIG.security.adminPasscode` |
| **`v1.2.0`** | 2026-07-28 | UI badge overflow fix, profile-scoped low stock warnings, unified Developer Settings Hub |
| **`v1.1.0`** | 2026-07-28 | Admin passcode security gate, strict email format validator, HTML tabular email reports |
| **`v1.0.1`** | 2026-07-28 | Supabase empty table auto-seeding logic, profile loading lock fix |
| **`v1.0.0`** | 2026-07-28 | Initial production release (React 18 + Vite 5 + Supabase + PWA + Vitals Tracker) |

---

## 🛠️ Quick Local Setup

1. **Clone repository & Install dependencies**:
   ```bash
   git clone https://github.com/tiwari17aditya/VitalsGuard-Health-Medication-Tracker.git
   cd "Medication Tracker"
   npm install
   ```

2. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔑 Central Configuration & Security

All app parameters, medical reference ranges, and security passcodes are maintained in a single central file:
- **Config File**: [`src/config/app.config.ts`](file:///d:/Antigravity-Projects/Medication%20Tracker/src/config/app.config.ts)
- **Default Developer Passcode**: **`1234`**

