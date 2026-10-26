# Project instructions

- The only website is site/. Read README.md, docs/design-menu.md and docs/multi-agent-workflow.md first.
- Public site: static HTML/CSS/JavaScript without a build step. The owner-requested private business dashboard lives in admin/, using Node built-ins and SQLite. Read docs/admin-dashboard.md for server, authentication and data boundaries. Never serve admin/data/ or commit operational data. Do not add a framework for ordinary changes.
- Inspect Git status, staged changes, branch and remotes before editing. Preserve unrelated work; never reset, clean, force-push or delete locks automatically.
- Use a task branch and separate worktree for changes. Assign explicit file ownership when multiple agents are involved. Reviewers remain read-only.
- Preserve the approved homepage/logo animation, twelve drink photos, animated coffee orbit without a visible background arc, one-column direct-selection list, serving volumes and bean counts. Volumes are owner-editable drafts; do not invent confirmed business facts.
- Keep Romanian comma-below diacritics, keyboard access and reduced motion. Menu changes load the selected image before moving; adjacent cups orbit together, direct jumps exit before entering. Do not claim the enquiry form sends a message without delivery verification.
- Run node scripts/check-site.mjs, node scripts/test-menu-switcher.mjs and git diff --check. Check affected pages on desktop/mobile when changing appearance or behavior.
- Handoff: branch, exact commit (or uncommitted status), changed files, validation and remaining limitations. Do not claim Claude/Gemini reviews unless they ran.
- Old com-site/com-site-2/com-site-3 layouts are available in Git history at f056d19; do not recreate duplicate sites in the active tree.
- Never commit credentials. Owner decides merge and deployment.

- For admin changes run node scripts/test-admin.mjs. Preserve server-side authentication, role checks, CSRF and private database boundaries. Do not seed production credentials or claim email notifications without verified delivery.
