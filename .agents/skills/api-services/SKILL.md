---
name: api-services
description: Standards for Vercel serverless API functions, Nodemailer integrations, email notification pipelines, and logger services.
---

# API & Services Skill

## Scope & Applicability
Applies when working on `api/send_mail.js`, `Utility/api/send_mail.js`, `src/services/emailService.ts`, `src/services/logService.ts`, or Vercel serverless route configurations.

## Core Rules & Constraints
- **Serverless Resilience**: Endpoint handlers (`api/*.js`) must properly parse incoming payloads, validate request bodies, handle CORS headers, and return standard JSON error/success responses.
- **Environment Variable Security**: Access credentials (SMTP, Supabase keys) only via process environment variables (`process.env`); never hardcode secrets.
- **Graceful Failure**: Mailer and logging service functions must capture network/API errors gracefully and prevent unhandled promise rejections from breaking the main UI thread.

## Verification Checklist
- [ ] API routes validate input and return appropriate HTTP status codes (200, 400, 500).
- [ ] No plaintext credentials or hardcoded API keys committed in code.
- [ ] Network errors in services are logged cleanly without causing UI crashes.
