# Supabase Free Database Setup Guide

CarePulse Health & Medication Tracker utilizes **Supabase PostgreSQL Free Tier** (500MB DB, free RESTful API).

---

## Step 1: Create a Free Supabase Account & Project
1. Visit [supabase.com](https://supabase.com) and click **Start your project** (100% Lifetime Free).
2. Click **New Project**, select an organization, name your project `medication-tracker`, and generate a secure Database Password.
3. Choose a region closest to your location and click **Create new project**.

---

## Step 2: Run Database Migration Script
1. Once your project dashboard loads, click on the **SQL Editor** tab on the left sidebar.
2. Click **New Query**.
3. Copy and paste the entire contents of `supabase/schema.sql` into the SQL Editor window.
4. Click **Run** (or `Ctrl + Enter`).
5. You will see success messages creating all 6 tables (`profiles`, `medications`, `medication_logs`, `glucose_logs`, `bp_logs`, `health_reports`) with Row-Level Security policies.

---

## Step 3: Retrieve API Credentials
1. In your Supabase Dashboard, click on **Project Settings** (gear icon) > **API**.
2. Copy the following values:
   - **Project URL** (e.g. `https://xyzabcdef.supabase.co`)
   - **Project API Keys (`anon` `public`)** (e.g. `eyJhbGci...`)

---

## Step 4: Add Secrets to Environment File (`.env`)
Create a `.env` file in the project root folder (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_RESEND_API_KEY=re_123456789
```

When deployed to GitHub Pages or Vercel, add these same keys to your repository Environment Secrets.
