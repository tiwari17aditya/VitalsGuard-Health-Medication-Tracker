---
name: release-git-docs
description: Workflow rules for automatic documentation updates, changelog tracking, version control staging, committing, and pushing.
---

# Release, Git & Documentation Skill

## Scope & Applicability
Applies during task completion / packup, updating `CHANGELOG.md`, `README.md`, versioning in `package.json`, and performing git workflow operations.

## Core Rules & Constraints
- **AUTOMATIC DOC UPDATES**: Just before every task completion/packup, automatically update all documentation, changelogs (`CHANGELOG.md`), trackers, and version files with details of your changes without waiting for user requests.
- **AUTOMATIC GIT WORKFLOW**: Automatically stage (`git add .`), commit with descriptive message (`git commit -m "..."`), and push (`git push`) all changes to the remote git repository on task completion.
- **Changelog Formatting**: Format changelog entries chronologically with explicit version numbers, dates, and categorized change summaries (Added, Fixed, Changed).

## Verification Checklist
- [ ] `CHANGELOG.md` updated with relative content of completed changes.
- [ ] Version updated in `package.json` if applicable.
- [ ] Changes staged, committed, and pushed to remote git repository.
