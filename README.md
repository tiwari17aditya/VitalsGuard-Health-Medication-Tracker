# CarePulse — Diabetes, Blood Pressure & Medication Tracker Dashboard

> A production-ready, open-source, 100% lifetime-free health tracking dashboard designed for elderly parents and caretakers. Built with React, Vite, TypeScript, Supabase PostgreSQL, PWA mobile capabilities, and GitHub Actions CI/CD.

---

## 🌟 Key Features

- 👥 **Multi-User Profile Management**: Manage separate profiles for Mom, Dad, Caretakers with full CRUD capabilities.
- 🩸 **Diabetes & Blood Sugar Tracking**: Log Fasting, Post-Meal, Bedtime readings with instant ADA medical standard classification (Normal, Pre-Diabetes, High).
- ❤️ **Blood Pressure (BP) Monitoring**: Record Systolic, Diastolic, Pulse with ACC/AHA categories (Normal, Elevated, Stage 1, Stage 2, Hypertensive Crisis alert).
- 💊 **Smart Pill Inventory (Add & Auto-Subtract)**: Track remaining pill count for each prescription. Intake button logs adherence and automatically subtracts 1 pill from inventory.
- ⚠️ **Advance Refill Alerts**: Visual warnings and email notifications triggered when stock drops below minimum threshold (default: 5 pills).
- 📅 **Interactive Schedule Calendar**: Monthly adherence timeline view showing checkmarks for taken doses and warnings for missed medicines.
- 📧 **Automated Caretaker Emails & Reports**: End-of-day compliance check emails, downloadable CSV & PDF reports, and weekly/monthly summary generators.
- 📱 **Downloadable PWA (iOS & Android)**: Progressive Web App compliance allowing "Add to Home Screen" installation on mobile devices.
- ⚡ **Single Central Configuration**: All thresholds, schedules, and schemas defined in one central file: `src/config/app.config.ts`.
- 🌐 **100% Lifetime Free & Open Source**: Zero subscription fees. Operates via free Supabase PostgreSQL, Resend free tier, and GitHub Pages free hosting.

---

## 🛠️ Open Source Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript
- **Styling**: Vanilla CSS Design System with accessible high-contrast UI
- **Database**: Supabase PostgreSQL (Free Tier) + HTML5 LocalStorage Offline Fallback
- **Email Engine**: Resend API / EmailJS
- **CI/CD & Deployment**: GitHub Actions (`.github/workflows/deploy.yml`)

See [TECH_STACK.md](./TECH_STACK.md) for full architecture details.

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/medication-tracker.git
cd medication-tracker
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`. The application works immediately out-of-the-box using local storage fallback mode!

### 3. Connect Supabase Free Database (Optional)
Refer to [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for step-by-step instructions to create a free Supabase PostgreSQL database and execute `supabase/schema.sql`.

---

## 🚀 Free Deployment via GitHub Actions

1. Push this repository to GitHub.
2. Go to **Settings > Pages** in your GitHub repository and set Source to **GitHub Actions**.
3. Push changes to `main` branch. The included `.github/workflows/deploy.yml` will automatically build and deploy your app to GitHub Pages for free!

---

## 📄 License
This project is licensed under the [MIT License](./LICENSE).
