# com. multi-agent workflow

## Scope and roles

`com-site-2/` is the primary site. `com-site/` and `com-site-3/` are reference snapshots. All three are static sites; there is no install or build step.

GitHub issues hold acceptance criteria and file ownership; pull requests hold the implementation and review record. Claude plans/design-reviews, Codex implements/verifies, and Gemini independently reviews. These are local interactive sessions with explicit handoffs, not unattended API calls. Each provider must be installed and signed in separately; this configuration does not impersonate other providers or launch paid calls automatically.

## Per-task procedure

1. Create a GitHub issue with the Agent task template (or keep the same fields in a local task note while GitHub is unavailable). Assign one writer per file.
2. Inspect `git status --short --branch`, `git diff`, `git diff --cached`, and `git worktree list`. Resolve existing locks with the owner before Git writes. Never delete a lock automatically.
3. Once this workflow configuration is committed and the worktree is clean, create a task worktree from the intended base. Example from the repository root:

   ```powershell
   git worktree add -b codex/task-slug ../com-codex-task-slug master
   ```

   Use a unique slug and unused destination; never force reuse. A worktree includes committed files only. Do not hide uncommitted work with an automatic stash. Fetch and inspect upstream before choosing the base once GitHub access is restored.
4. Open Claude in the task checkout for a read-only plan: outcome, affected files, acceptance criteria, design constraints, and risks. Run `claude` after installation/sign-in. Read AGENTS.md and this guide.
5. Open Codex in the same task checkout after the planner finishes, or use `codex` there. Implement only owned files. For concurrent writing, create separate branches/worktrees for the other writers and assign non-overlapping paths.
6. Run `node scripts/check-site.mjs` and `git diff --check`. Open `com-site-2/index.html` and inspect affected pages, narrow/wide layouts, keyboard navigation, switcher transitions, and reduced motion. The automated check covers quoted local href/src, CSS URLs, static HTML fragments, and JS syntax; it does not cover external links, dynamic URLs, visual behavior, full HTML validity, or form delivery.
7. Commit only task files. Give Gemini the exact commit and diff, and run `gemini` from that checkout after installation/sign-in. Request read-only review; do not run a writer simultaneously in that folder. Record findings with file/line evidence. Re-review any subsequent fixes.
8. Push the task branch and open a PR against `master` when remote access is available. Use the PR template, including the actual reviewed commit and checks not run. The GitHub web UI is sufficient; the GitHub CLI is optional. Owner reviews and merges. No automatic deployment is configured.

## Handoff prompts

- Claude: "Read AGENTS.md. Plan task <issue> for com-site-2. Read reference sites only. Do not edit. List owned files, acceptance criteria, and design risks."
- Codex: "Read AGENTS.md and the accepted plan for <issue>. Implement in branch <branch>, only within <files>. Validate and report the exact commit, changes, checks, and open risks."
- Gemini: "Read AGENTS.md. Review commit <sha> against <base> for <issue> without editing. Prioritize regressions, accessibility, mobile layouts, Romanian copy, and honest form behavior. Give actionable file/line findings; distinguish checks run from suggestions."

## Initial inspection, 2026-10-10

- Repository: `D:\comcoffee\comsite\com`; origin: `https://github.com/Txdor1411/com-coffee.git`.
- Branch: `master`; HEAD and cached `origin/master`: `2a32f8b` (initial commit). Working tree and index clean before configuration; no other local branches or worktrees observed.
- Existing zero-byte `.git/index.lock`, dated 2026-10-06, was preserved. Its age does not prove it is safe to delete. This can block add/commit/worktree creation. Close or finish the owning Git operation and have the owner resolve a confirmed stale lock before proceeding.
- Live remote check returned "Repository not found." Confirm the repository URL and sign in with an account that can access it. Cached origin/master is not proof of current synchronization. Git Credential Manager is configured; push permission remains unverified.
- Codex CLI: installed and signed in using ChatGPT. `claude`, `gemini`, and `gh`: not found on PATH. Claude/Gemini authentication could not be verified. Browser or other-app sessions may exist independently.
- The historical CLAUDE.md brief referenced by the site READMEs was absent. The added entry point provides workflow instructions only.

## Activation and authentication

Install Claude Code and Gemini CLI using their official setup instructions, then open each CLI and finish its own sign-in. No model API keys are required by the added GitHub checks. Never paste tokens into tracked files. Do not assume ChatGPT sign-in authenticates Claude, Gemini, or GitHub.

After resolving the Git lock, review and commit the added workflow files on a setup branch, then push and create a PR when remote access is fixed. CI becomes active only after the workflow is pushed. Recommended repository rule, to be enabled by the owner: PR review plus required `primary-site` check for `master`; branch protection is not configured by these files.

## Official references

- Codex instructions: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Claude memory and imports: https://code.claude.com/docs/en/memory
- Claude setup: https://code.claude.com/docs/en/setup
- Gemini context: https://geminicli.com/docs/cli/gemini-md/
- Gemini authentication: https://geminicli.com/docs/get-started/authentication/
- Git worktrees: https://git-scm.com/docs/git-worktree
- GitHub checkout: https://github.com/actions/checkout
