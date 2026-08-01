---
name: release-git-docs
description: Workflow rules for automatic documentation updates, changelog tracking, version control staging, committing, and pushing.
---

# Release, Git & Documentation Skill

## Scope & Applicability
Applies during task completion / packup, updating `CHANGELOG.md`, `README.md`, versioning in `package.json`, and performing git workflow operations.

## Core Rules & Constraints
- **AUTOMATIC DOC UPDATES**: Just before every task completion/packup, automatically update all documentation, changelogs (`CHANGELOG.md`), token usage ledgers (`Research/TOKEN_USAGE_LOG.md`), trackers, and version files with details of your changes without waiting for user requests.
- **AUTOMATIC GIT WORKFLOW**: Automatically stage (`git add .`), commit with descriptive message (`git commit -m "..."`), and push (`git push`) all changes to the remote git repository on task completion.
- **Changelog & Token Log Formatting**: Format changelog entries chronologically and record estimated token usage / savings per session in `Research/TOKEN_USAGE_LOG.md`.

## Verification Checklist
- [ ] `CHANGELOG.md` updated with relative content of completed changes.
- [ ] `Research/TOKEN_USAGE_LOG.md` updated with token metrics for the current session/task.
- [ ] Version updated in `package.json` if applicable.
- [ ] Changes staged, committed, and pushed to remote git repository.
