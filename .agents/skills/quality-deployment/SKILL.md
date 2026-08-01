---
name: quality-deployment
description: Protocols for TypeScript type checking, Oxlint code linting, Vite build pipeline, and Vercel deployment configuration.
---

# Quality & Deployment Skill

## Scope & Applicability
Applies when running build scripts, type checking, modifying `package.json`, `tsconfig*.json`, `.oxlintrc.json`, `vite.config.ts`, or `vercel.json`.

## Core Rules & Constraints
- **Empirical Build Verification**: Never declare a task resolved without running build and lint checks.
- **Oxlint Compliance**: Maintain code quality conforming to `.oxlintrc.json` rules. Resolve all linter warnings.
- **Strict Type Checking**: TypeScript compilation (`tsc -b`) must succeed with zero type errors before completing work.
- **PWA & Deploy Safety**: Ensure service worker configurations in `vite.config.ts` and route rewrites in `vercel.json` are valid.

## Verification Checklist
- [ ] Executed `npm run lint` and verified zero linter errors.
- [ ] Executed `npm run build` and verified clean TypeScript compilation.
