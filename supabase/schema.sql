-- ====================================================================
-- CAREPULSE MEDICATION & HEALTH TRACKER - SUPABASE POSTGRESQL SCHEMA
-- Open Source & 100% Lifetime Free Tier Compatible
-- ====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Parent',
    age INTEGER,
    target_glucose_fasting TEXT DEFAULT '70-100 mg/dL',
    target_glucose_post_meal TEXT DEFAULT '< 140 mg/dL',
    target_bp TEXT DEFAULT '120/80 mmHg',
    emergency_contact TEXT,
    doctor_name TEXT,
    notes TEXT,
    avatar_color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MEDICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.medications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    times TEXT[] DEFAULT ARRAY['08:00'],
    stock_count INTEGER NOT NULL DEFAULT 30,
    min_stock_alert INTEGER NOT NULL DEFAULT 5,
    instructions TEXT,
    food_relation TEXT DEFAULT 'After Food',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MEDICATION ADHERENCE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.medication_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    medication_id TEXT REFERENCES public.medications(id) ON DELETE CASCADE,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'taken', -- 'taken', 'missed', 'skipped'
    quantity_taken INTEGER DEFAULT 1,
    notes TEXT
);

-- 4. BLOOD GLUCOSE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.glucose_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    meal_type TEXT NOT NULL DEFAULT 'fasting', -- 'fasting', 'post_meal', 'bedtime', 'random'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL,
    notes TEXT
);

-- 5. BLOOD PRESSURE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.bp_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    pulse INTEGER NOT NULL DEFAULT 72,
    category TEXT NOT NULL DEFAULT 'Normal',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- 6. HEALTH REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.health_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    adherence_rate NUMERIC DEFAULT 100,
    avg_glucose NUMERIC,
    avg_systolic NUMERIC,
    avg_diastolic NUMERIC,
    low_stock_meds_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Allow public access for simple deployment (or customize RLS as needed)
CREATE POLICY "Allow public read/write profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow public read/write medications" ON public.medications FOR ALL USING (true);
CREATE POLICY "Allow public read/write med_logs" ON public.medication_logs FOR ALL USING (true);
CREATE POLICY "Allow public read/write glucose" ON public.glucose_logs FOR ALL USING (true);
CREATE POLICY "Allow public read/write bp" ON public.bp_logs FOR ALL USING (true);
CREATE POLICY "Allow public read/write reports" ON public.health_reports FOR ALL USING (true);
