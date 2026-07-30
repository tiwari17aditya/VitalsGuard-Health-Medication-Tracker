# Technical Architecture & Open Source Tech Stack

This document details every technology, framework, database tier, email provider, and CI/CD workflow used in the **VitalsGuard Diabetes, BP & Medication Tracker Dashboard**.

---

## 1. Summary Matrix (100% Lifetime Free & Open Source)

| Component Layer | Technology | License / Pricing Tier | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | React 18 + TypeScript | MIT (Open Source) | SPA architecture, modular components, strict type safety |
| **Build Tooling** | Vite 5 | MIT (Open Source) | Next-gen hot reload, optimized production bundle |
| **Mobile PWA** | `vite-plugin-pwa` | MIT (Open Source) | Web Manifest & Service Worker for downloadable iOS/Android app |
| **Database** | Supabase (PostgreSQL) | Lifetime Free Tier (500MB DB) | Multi-user relational storage, Row Level Security, REST APIs |
| **Offline Storage** | HTML5 LocalStorage API | Built-in Browser Standard | Zero-config offline fallback when network is disconnected |
| **Styling & UI** | Vanilla CSS + Design Tokens | Custom Modern CSS | Glassmorphism, accessible tap targets for elderly parents |
| **Icons & Visuals** | `lucide-react` | ISC / MIT (Open Source) | Accessible vector icons for health & medical metrics |
| **Email Engine** | Nodemailer / SMTP | Free (No direct API limit) | Refill alert emails & end-of-day compliance check digests via secure SMTP |
| **Hosting** | Vercel | 100% Lifetime Free | Global CDN & serverless hosting |
| **CI/CD Pipeline** | Vercel Git Integration | 100% Lifetime Free | Auto build & deploy on git push |

---

## 2. Open Source Compliance & License Guarantee
- All NPM packages included are released under **permissive open-source licenses** (MIT, ISC, Apache 2.0).
- No paid third-party SDKs, API keys, or subscriptions are required to run this project in production.
- Out-of-the-box local storage engine guarantees the application is functional even before setting up external database keys.
