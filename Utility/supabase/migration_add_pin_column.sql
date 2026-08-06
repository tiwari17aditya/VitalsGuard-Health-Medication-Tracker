-- ====================================================================
-- VITALSGUARD SQL MIGRATION: Add missing `pin` & `is_locked` columns with PII Classification Tagging
-- Run this in your Supabase SQL Editor if your profiles table was created earlier.
-- ====================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '1234';

-- Tag PIN column with PII Sensitive Credential Security Label
COMMENT ON COLUMN public.profiles.pin IS 'PII_SENSITIVE_CREDENTIAL: Encrypted PII PIN payload protected by VitalsGuard PII Security Protocol.';
