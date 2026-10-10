---
name: commit
description: Commit message formatting and guidelines
---

# Commit

Use this skill whenever the user asks you to create a git commit for the current work.

## Instructions

1. Review the current git state before committing:
   - `git status`
   - `git diff`
   - `git log -5 --oneline`
2. Only stage files relevant to the requested change. Do not include unrelated
   untracked files, generated files, or likely-local artifacts. Never stage
   `ghost-lite-master-plan.txt`.
3. Write a short, plain subject line that says what changed (for example
   `Remove AMP redirects`), with an optional body explaining why.
4. Run `git status --short` after committing and confirm the result.

## Important

- Do not push to remote unless the user explicitly asks
- Keep commits focused and avoid bundling unrelated changes
- If there are no relevant changes, do not create an empty commit
