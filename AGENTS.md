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
