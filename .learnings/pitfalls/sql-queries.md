# SQL Query Pitfalls

## Learnings

### COALESCE with Zero Default Creates False Positives in Comparison Queries
**Source**: BLD-5 — Phase 10: Workout Insights (PR Detection)
**Date**: 2026-04-13
**Context**: `getRecentPRs` used `COALESCE(subquery, 0)` to provide a default when no historical max existed for an exercise. Any weight > 0 then beat the default, making every first-ever exercise appear as a "personal record."
**Learning**: When a correlated subquery returns NULL (no prior data), `COALESCE(..., 0)` converts it to a value within the valid data range. A bare `>` comparison against NULL correctly evaluates to NULL/false, naturally excluding rows with no history. Two sibling functions (`getMaxWeightByExercise`, `getSessionPRs`) already handled this correctly — the inconsistency was caught only in code review.
**Action**: Never use COALESCE to supply a default for aggregate comparison queries — let SQL NULL propagation exclude no-data rows. When writing a set of related query functions, review all of them together for consistent NULL/edge-case handling.
**Tags**: sqlite, sql, coalesce, null-propagation, aggregate, comparison, consistency, code-review
