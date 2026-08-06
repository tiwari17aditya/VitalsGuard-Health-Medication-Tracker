# Technical Architecture & Stack

This document details every technology, framework, database tier, email provider, and CI/CD workflow used in the **VitalsGuard Diabetes, BP & Medication Tracker Dashboard**.

---

## 1. Summary Matrix (100% Lifetime Free)

| Component Layer | Technology | Pricing Tier | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | React 18 + TypeScript | Free | SPA architecture, modular components, strict type safety |
| **Build Tooling** | Vite 5 | Free | Next-gen hot reload, optimized production bundle |
| **Mobile PWA** | `vite-plugin-pwa` | Free | Web Manifest & Service Worker for downloadable iOS/Android app |
| **Database** | Supabase (PostgreSQL) | Lifetime Free Tier (500MB DB) | Multi-user relational storage (`profiles` with `is_locked` column, `medications`, `medication_logs`, `glucose_logs`, `bp_logs`, `water_items`, `water_logs`), RLS policies |
| **Offline Storage** | HTML5 LocalStorage API | Built-in Browser Standard | Zero-config offline fallback (`vitalsguard_profiles_v1`, `vitalsguard_water_items_v1`, `vitalsguard_water_logs_v1`) |
| **Styling & UI** | Vanilla CSS + Design Tokens | Free | Glassmorphism, accessible tap targets for elderly parents |
| **Icons & Visuals** | `lucide-react` | Free | Accessible vector icons for health & medical metrics |
| **Email Engine** | Nodemailer / SMTP | Free (No direct API limit) | Refill alert emails & end-of-day compliance check digests via secure SMTP |
| **Hosting** | Vercel | 100% Lifetime Free | Global CDN & serverless hosting |
| **CI/CD Pipeline** | Vercel Git Integration | 100% Lifetime Free | Auto build & deploy on git push |

---

## 2. Compliance & Cost Guarantee
- All NPM packages included are free to use.
- No paid third-party SDKs, API keys, or subscriptions are required to run this project in production.
- Out-of-the-box local storage engine guarantees the application is functional even before setting up external database keys.
