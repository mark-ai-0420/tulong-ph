# AGENTS.md — TulongPH

Shared development instructions for Antigravity 2.0 and Codex CLI.

## Project and commands
Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4; pnpm declared in package.json.

- Development: `pnpm run dev`.
- Verification: `pnpm run lint`, `pnpm run test:unit`, `pnpm run build`. Run affected checks before reporting implementation complete.
- Use installed dependencies and the current lockfile; do not upgrade tools just to follow an example.

## Project invariants
- Read `README.md` and `DESIGN.md`; preserve calm civic copy, accessible forms and low-ink printable output.
- Keep intake records and uploaded documents private. Preserve existing local-storage/offline behavior and never add external upload or analytics of applicant data without authorization.
- Verify assistance calculations, deduction order, rounding and zero/partial-bill cases when billing or triage logic changes. Guidance is not a guarantee of eligibility or funding.
- Verify current assistance requirements against official agency sources before updating program claims.
- For intake/autocompute changes run `pnpm run test:e2e` as well; inspect `scripts/test-e2e-autocompute.mjs` for required server/browser setup first. `pnpm test` includes both unit and E2E checks.
- Verify document exports and print layouts if affected. Preserve server/client boundaries and offline recovery.

## Co-working and release controls
- Antigravity leads architecture, integration and browser verification; Codex handles assigned terminal tasks, focused edits, debugging and reviews. The user can change that assignment.
- Check `git status --short` before editing. Preserve unrelated work. Assign one writer per file and record scope, branch, owned files, checks and remaining work when handing off between apps. Reuse existing handoff documents; they are context, not fresh authorization.
- Follow shared global defaults and these project instructions. Read relevant referenced rules explicitly in Codex. Use available skills when relevant; report missing tools honestly rather than claiming a review or invocation.
- Do not commit, push, merge, deploy, publish externally, run production migrations or execute destructive rollback commands without explicit user authorization for that action. Satisfy verification and schema-review gates first. Already granted authorization remains valid for its scope.
- Keep secrets and personal data out of logs, screenshots, handoffs and external model prompts. Never weaken authorization or data isolation to make a test pass.
- Report checks actually run, results and limitations. Do not invent package scripts or claim visual verification from a build alone.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
