# Technical Architecture & Stack

This document details every technology, framework, database tier, email provider, and CI/CD workflow used in the **VitalsGuard Diabetes, BP & Medication Tracker Dashboard**.

---

## 1. Summary Matrix (100% Lifetime Free)

| Component Layer | Technology | Pricing Tier | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | React 19 + TypeScript 5 | Free | SPA architecture, modular components, strict type safety |
| **Build Tooling** | Vite 8 | Free | Next-gen hot reload, optimized production bundle |
| **Mobile PWA** | `vite-plugin-pwa` | Free | Web Manifest & Service Worker for downloadable iOS/Android app |
| **Security & Auth** | PII Encryption + Single Admin Authority | Free | Client-side PII encryption (`PII_ENC:`), exact single-match verification, RBAC role demotion protection |
| **Cloud Database** | Supabase (PostgreSQL) | Lifetime Free Tier (500MB DB) | Multi-user relational storage (`profiles`, `medications`, `medication_logs`, `glucose_logs`, `bp_logs`, `water_items`, `water_logs`), RLS policies, cloud `system-settings` sync |
| **Offline Storage Engine** | 3-Layer Hybrid Maps + LocalStorage | Built-in Browser Standard | Zero-config offline fallback with dedicated state maps (`vitalsguard_daily_email_map`, `vitalsguard_caretaker_email_map`, `vitalsguard_profile_pins_map`) |
| **Styling & UI** | Vanilla CSS + Design Tokens | Free | Glassmorphism, accessible tap targets for elderly parents, animated SVG waves |
| **Icons & Visuals** | `lucide-react` | Free | Accessible vector icons for health & medical metrics |
| **Email Engine** | Nodemailer / SMTP (Serverless) | Free | Daily low-stock email digests, refill alert emails & compliance checks via secure SMTP + client mailto fallback |
| **Virtual Environment** | Python `.venv` + `requirements.txt` | Free | Tooling isolation preventing personal system module pollution |
| **Hosting** | Vercel | 100% Lifetime Free | Global CDN & serverless edge hosting |
| **CI/CD Pipeline** | Vercel Git Integration | 100% Lifetime Free | Auto build & deploy on git push |

---

## 2. Compliance & Cost Guarantee
- All NPM packages included are free to use.
- No paid third-party SDKs, API keys, or subscriptions are required to run this project in production.
- Out-of-the-box local storage engine guarantees the application is functional even before setting up external database keys.
