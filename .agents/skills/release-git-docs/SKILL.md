---
name: release-git-docs
description: Workflow rules for automatic documentation updates, changelog tracking, version control staging, committing, and pushing.
---

# Release, Git & Documentation Skill

## Scope & Applicability
Applies during task completion / packup, updating `CHANGELOG.md`, `README.md`, versioning in `package.json`, and performing git workflow operations.

## Core Rules & Constraints
- **AUTOMATIC DOC UPDATES**: Just before every task completion/packup, automatically update all documentation, changelogs (`CHANGELOG.md`), `README.md`, `Research/ENHANCEMENTS.md`, `Research/TECH_STACK.md`, token usage ledgers (`Research/TOKEN_USAGE_LOG.md`), trackers, and version files with details of your changes without waiting for user requests.
- **AUTOMATIC GIT WORKFLOW**: Automatically stage (`git add .`), commit with descriptive message (`git commit -m "..."`), and push (`git push`) all changes to the remote git repository on task completion.
- **SKILL MAINTENANCE**: Audit existing skills and create or update domain skills under `.agents/skills/` whenever project structure or features evolve.
- **Changelog & Token Log Formatting**: Format changelog entries chronologically. In `Research/TOKEN_USAGE_LOG.md`, group chat session entries by date (`### 📅 Date: YYYY-MM-DD`) and separate date blocks with 3 empty lines for clean visual separation.

## Task Packup Protocol ("packup" trigger)
Whenever a task is completed or "packup" is requested, execute the following workflow:
1. **Documentation Updates**:
   - `README.md`: Update feature highlights, version history table, and quick setup.
   - `CHANGELOG.md`: Record version changes and chronological release notes.
   - `Research/ENHANCEMENTS.md`: Document completed enhancements, architectural roadmaps, and future feature proposals.
   - `Research/TECH_STACK.md`: Update tech stack components, state models, database tables, and framework specifications.
   - `Research/TOKEN_USAGE_LOG.md`: Log token metrics for the session grouped by date (`### 📅 Date: YYYY-MM-DD`).
2. **Skill Architecture Audit**:
   - Evaluate project structure and domain modifications. Create or update domain skills under `.agents/skills/` (and update `AGENTS.md` routing table) to maintain lightweight context management.
3. **Version Control & Deployment**:
   - Bump version in `package.json` if applicable.
   - Stage all changes (`git add .`).
   - Commit with a descriptive message (`git commit -m "..."`).
   - Push to remote repository (`git push`).

## Verification Checklist
- [ ] `README.md`, `CHANGELOG.md`, `Research/ENHANCEMENTS.md`, `Research/TECH_STACK.md` updated.
- [ ] `Research/TOKEN_USAGE_LOG.md` updated with token metrics for the current session/task.
- [ ] Version updated in `package.json` if applicable.
- [ ] Skills audited and updated under `.agents/skills/` if new domains/rules added.
- [ ] Changes staged, committed, and pushed to remote git repository (`git push`).
