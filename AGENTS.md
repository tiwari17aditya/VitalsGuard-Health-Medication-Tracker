# VitalsGuard Routing Table

| Context / File Extensions / Tasks | Active Skill |
| :--- | :--- |
| `src/lib/supabase.ts`, `Utility/supabase/*.sql`, Database | `database-storage` |
| `src/components/*.tsx`, `*.css`, `AppContext.tsx`, UI | `ui-components` |
| `api/*.js`, `src/services/*.ts`, Mailer/Services | `api-services` |
| `package.json`, `tsconfig*.json`, Build/Lint | `quality-deployment` |
| Task Packup, `CHANGELOG.md`, Git Stage/Commit/Push | `release-git-docs` |

## Skill Routing Principles
- Activate the appropriate skill(s) before performing domain modifications.
- Combine skills for multi-domain features (e.g. UI + Database).
- Keep active context lightweight by referencing domain SKILL.md rules.

## Development & Deployment Protocol
- All feature additions, bug fixes, and schema/code modifications must be made and verified in the local environment first.
- Perform complete end-to-end testing locally before committing, staging, or promoting changes to the main production environment to avoid live feature conflicts and disruption for active users.

## Environment Isolation & Resource Cleanup Protocol
- Always run commands, scripts, and dependencies strictly isolated within the local `.venv` virtual environment (or workspace `node_modules`) to prevent polluting personal system module versions.
- Automatically clean up temporary scratch files, local download caches, and intermediate build output artifacts after task verification to preserve user storage and system resources.
