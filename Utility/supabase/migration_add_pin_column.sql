-- ====================================================================
-- VITALSGUARD SQL MIGRATION: Add missing `pin` & `is_locked` columns
-- Run this in your Supabase SQL Editor if your profiles table was created earlier.
-- ====================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '1234';
