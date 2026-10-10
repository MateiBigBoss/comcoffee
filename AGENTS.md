# Repository instructions

- Primary site: `com-site-2/`. `com-site/` and `com-site-3/` are reference snapshots; read them for comparison, but do not change them unless the task explicitly requests it.
- This is static HTML/CSS/JavaScript. Do not introduce a framework, build pipeline, or runtime dependency for ordinary site changes.
- Read `com-site-2/README.md` and `docs/multi-agent-workflow.md` before work. The historical design brief mentioned in the site READMEs is missing; the new CLAUDE.md is a workflow entry point, not that brief.
- Inspect status, staged changes, branch, and remote before edits. Preserve unrelated work. Never reset, clean, force-push, delete Git locks, or overwrite someone else's changes.
- Use one task branch and separate worktree per writing agent. Assign explicit file ownership in the task; reviewers stay read-only. Coordinate overlapping files sequentially.
- Default roles: Claude plans and reviews design; Codex implements and verifies; Gemini independently reviews accessibility, content, and regressions. Roles may be reassigned in the task.
- Keep Romanian copy and comma-below diacritics. Preserve reduced-motion behavior and the coffee switcher's exit/enter contract. Do not invent business facts or imply the demo form sends requests.
- Run `node scripts/check-site.mjs` and `git diff --check`; manually check changed pages on mobile and desktop, keyboard navigation, and reduced motion when affected.
- Handoff: task, branch, exact commit (or explicitly uncommitted), changed files, validation, open risks, and reviewer findings. Do not claim another provider reviewed code unless it actually ran.
- Never commit credentials. GitHub is the task/PR record; merge and deployment remain owner decisions.
