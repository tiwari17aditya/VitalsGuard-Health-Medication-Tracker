# 🛡️ VitalsGuard Security Audit & Findings Report

**Date**: 2026-08-17  
**Status**: 🔒 Resolved & Hardened in v1.22.1  
**Severity**: High (Authentication Privilege & Multiple Password Collision)

---

## 📌 Executive Summary

During authentication verification, a critical security flaw was identified where multiple passwords (`1234`, `2580`, and `170507`) were simultaneously accepted as valid Admin Passwords for restricted administrative actions and user profile locks. 

This document records the exact root cause analysis (RCA), technical breakdown, fixes implemented in **v1.22.1**, and architectural security recommendations for future releases.

---

## 🔍 Root Cause Analysis (RCA)

### 1. Multi-Source State Divergence
The application maintained four independent locations for storing the Admin Password without a single authoritative source of truth:
1. **Supabase PostgreSQL `profiles` table** (`id = "system-settings"`, `notes` column) — contained historical PIN `170507`.
2. **Supabase PostgreSQL `profiles` table** (`id = "admin"`, `pin` column) — contained historical PIN `2580`.
3. **Browser LocalStorage** (`vitalsguard_admin_pin` key) — held whichever password was last updated in local session.
4. **Static Configuration** (`APP_CONFIG.security.adminPasscode`) — hardcoded default `1234`.

### 2. Multi-Key Fallback Decryption in `verifyPIIPin`
The verification helper `verifyPIIPin` in `src/utils/piiSecurity.ts` attempted to verify entered input against multiple fallback keys in a waterfall sequence:
- Direct match with `input === storedCipherOrPlain` (matched `2580`).
- Master passcode check with `masterPasscode` (matched `170507`).
- Hardcoded check `if (input === "1234") return true;` (matched `1234`).
- Custom local storage key decryption check.

Because `verifyPIIPin` returned `true` if **any** of these matched, all three historical and default passwords passed authorization concurrently.

### 3. Role Boundary Permeability in `AdminAuthModal.tsx`
In `AdminAuthModal.tsx`, `handleSubmit` evaluated `isAdminValid` using a union of `savedAdminPin`, `adminProfile.pin`, and `APP_CONFIG`. Furthermore, in `mode === "user"`, entering the Admin Password automatically bypassed user profile PIN verification without logging a security privilege escalation event.

---

## 🛠️ Remediations Implemented (v1.22.1)

| Vulnerability / Issue | Implemented Fix | Modified Files |
| :--- | :--- | :--- |
| **Multi-Password Collision** | Unified Admin Password to a single authoritative source (`activeAdminPin`), strictly synchronized across `system-settings.notes`, `admin` profile row, and `vitalsguard_admin_pin`. | [`src/context/AppContext.tsx`](file:///d:/Antigravity-Projects/Medication%20Tracker/src/context/AppContext.tsx) |
| **Universal `1234` Bypass** | Removed hardcoded `1234` fallback in `verifyPIIPin`. If a password is changed, `1234` is strictly rejected. | [`src/utils/piiSecurity.ts`](file:///d:/Antigravity-Projects/Medication%20Tracker/src/utils/piiSecurity.ts) |
| **Multi-Key Decryption Leak** | Refactored `verifyPIIPin` to evaluate single exact matching without waterfall multi-key fallbacks. | [`src/utils/piiSecurity.ts`](file:///d:/Antigravity-Projects/Medication%20Tracker/src/utils/piiSecurity.ts) |
| **Modal Verification Boundary** | Enforced strict check in `AdminAuthModal.tsx`: `mode === "admin"` strictly verifies only against the active single Admin Password. | [`src/components/AdminAuthModal.tsx`](file:///d:/Antigravity-Projects/Medication%20Tracker/src/components/AdminAuthModal.tsx) |

---

## 🔮 Future Security Hardening Recommendations

1. **Client-Side PBKDF2 / Argon2 Password Hashing**:
   - Replace reversible XOR cipher with salted, one-way PBKDF2 or Web Crypto API `crypto.subtle.digest('SHA-256')` hashes for user PINs and Admin Passwords.
2. **Rate Limiting & Exponential Lockout**:
   - Add brute-force protection: lock authentication modal for 30 seconds after 5 consecutive failed password attempts.
3. **Dedicated Admin Table / Auth Column**:
   - Separate system credentials from the `public.profiles` table into a dedicated `public.app_security` table or Supabase Auth schema.
4. **Audit Logging for Admin Overrides**:
   - Whenever an Admin password is used to access or delete a user's health logs, create an immutable audit record in `ActionAuditLog` flagged with `ADMIN_OVERRIDE_AUTH`.
