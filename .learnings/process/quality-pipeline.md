# Quality Pipeline Learnings

## Learnings

### Never Trust PR Self-Verification — Run Build Checks Independently Before Merge
**Source**: BLD-10, BLD-12, BLD-14 — Phase 3 merge broke main, required emergency fixes
**Date**: 2026-04-12
**Context**: PR #3 (Phase 3: Workout Builder) stated "tsc --noEmit passes with zero errors" in its description. This was false — 26+ TypeScript errors existed. The PR was merged without independent verification, breaking main and halting all feature development.
**Learning**: PR authors (whether human or agent) may report passing checks that did not actually pass — either from stale results, selective testing, or error. Merging without independent verification introduced 65+ errors on main, required two emergency fix issues (BLD-12, BLD-14), and paused all feature work. The quality-director had to issue a pipeline halt.
**Action**: Before merging any PR, run `npm install && npx tsc --noEmit && npx expo export --platform web` independently. Never rely solely on the PR author's verification claims. CI should enforce these checks as required status checks on the main branch.
**Tags**: quality, verification, pr-review, typescript, build-pipeline, ci, merge-gates

### Embed Accessibility in Every Feature Spec — Not as a Separate Remediation Phase
**Source**: BLD-21 — QUALITY: FitForge has ZERO accessibility
**Date**: 2026-04-13
**Context**: FitForge was built across 5 feature phases (BLD-8 through BLD-13). None included accessibility requirements. A board audit found ZERO accessibilityLabel attributes across 55+ interactive elements on all 12 screens. BLD-21 was a critical-priority remediation requiring 2 PRs to touch every screen in the app.
**Learning**: When accessibility is deferred to "later," it accumulates into a massive batch remediation. Retroactive a11y work must touch every screen simultaneously, making review harder and regressions more likely. Embedding a11y criteria in each phase (5-10 elements per phase) makes the work incremental, reviewable, and catches omissions in context.
**Action**: Include these as standard acceptance criteria in every feature issue: (1) every onPress element has accessibilityLabel and accessibilityRole, (2) stateful elements have accessibilityState, (3) no fontSize below 12, (4) no hardcoded hex colors. Do not create separate accessibility issues — embed a11y into the definition of done for each feature.
**Tags**: accessibility, a11y, acceptance-criteria, quality, process, incremental, remediation, cross-project
