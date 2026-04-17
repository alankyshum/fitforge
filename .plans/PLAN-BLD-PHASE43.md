# Phase 43 — 1RM Trend Chart, Session Annotations & Plate Calculator Deep Link

**Issue**: BLD-260 (PLAN)
**Status**: REVISED (addressing QD review feedback)
**Author**: CEO
**Date**: 2026-04-17
**Revision**: 2 — Scoped down after QD audit found ~80% of original plan duplicates existing code

## Problem Statement

FitForge already has estimated 1RM display, percentage tables, a plate calculator, and a 1RM calculator tool. However, three genuinely useful enhancements are missing:

1. **1RM Trend Chart** — The existing exercise detail chart shows **max weight** over time, but NOT estimated 1RM. Users who train with varying rep schemes (e.g., 5×5 one week, 3×8 the next) can't see their true strength progression because max weight doesn't account for reps.

2. **1RM Annotation in Session View** — During a workout session, users see previous sets but have no context about what those sets represent as a percentage of their estimated max. Adding "est. 1RM: X kg" alongside previous sets helps users gauge intensity.

3. **Percentage → Plate Calculator Deep Link** — The percentage table on the exercise detail screen currently links to `/tools/rm` (1RM Calculator). A more useful flow: tap a percentage weight → open the Plate Calculator pre-filled with that weight, so users immediately know which plates to load.

## Existing Code (DO NOT DUPLICATE)

These already exist and must NOT be recreated:
- `lib/rm.ts` — Epley + Brzycki + Lombardi formulas, `percentageTable()`
- `lib/plates.ts` — Plate calculation logic with standard plate colors
- `app/tools/plates.tsx` — Full plate calculator screen (367 lines)
- `app/tools/rm.tsx` — 1RM calculator tool (219 lines)
- `app/tools/index.tsx` — Tools hub with Timer + 1RM Calc + Plate Calc
- `app/exercise/[id].tsx` — Already shows Est 1RM stat + percentage table + bodyweight exclusion
- `__tests__/lib/rm.test.ts`, `__tests__/lib/plates.test.ts` — Existing unit tests

## Proposed Solution

### Feature A: 1RM Trend Chart on Exercise Detail

Add a second chart (or chart toggle) to the exercise detail screen showing estimated 1RM over time:
- Query: for each session, compute best estimated 1RM from that session's sets (using existing `estimate1RM()` from `lib/rm.ts`)
- Chart style: reuse existing max-weight chart pattern (same component, different data)
- Toggle or tab: "Max Weight" vs "Est. 1RM" (let user switch between views)
- Accessibility: chart summary text describing trend direction and % change

### Feature B: 1RM Annotation in Session View

On the session screen (`app/session/[id].tsx`), when showing previous sets for an exercise group:
- Below or beside each previous set, show the estimated 1RM: e.g., "80 kg × 8 → est. 1RM: 101 kg"
- Use existing `estimate1RM()` from `lib/rm.ts` — pure calculation, no new DB queries
- Only show for weighted exercises (not bodyweight)
- Use secondary text styling (smaller, muted color, ≥12px font)

### Feature C: Percentage → Plate Calculator Deep Link

Change the percentage table's action flow:
- Currently: tapping the bottom button goes to `/tools/rm`
- New: add a tap handler on each percentage row → navigates to `/tools/plates?weight=<value>&unit=<unit>`
- The plate calculator screen (`app/tools/plates.tsx`) must accept URL query params to pre-fill the target weight
- Keep the existing "1RM Calculator" button as-is (don't remove it)

## Scope

### In Scope
- 1RM trend chart data query (best est. 1RM per session for an exercise)
- Chart toggle between "Max Weight" and "Est. 1RM" on exercise detail
- 1RM annotation text on previous sets in session view
- Percentage row → plate calculator navigation with pre-filled weight
- Plate calculator accepting `weight` and `unit` URL query params
- Accessibility for all new UI elements (≥12px font, screen reader labels)
- Unit tests for the new 1RM history query logic

### Out of Scope
- New calculation libraries (use existing `lib/rm.ts`)
- New plate calculator (use existing `app/tools/plates.tsx`)
- New 1RM display card (already exists on exercise detail)
- Changes to percentage table layout (just add tap behavior)
- New tools hub entries (already complete)
- Schema changes (all derived from existing data)

### Dependencies
- `lib/rm.ts` — `estimate1RM()` function
- `app/exercise/[id].tsx` — existing chart and percentage table
- `app/session/[id].tsx` — previous sets display
- `app/tools/plates.tsx` — plate calculator (needs to accept URL params)
- Existing chart library (victory-native or equivalent)

## Implementation Details

### New Files
- None expected — all changes are modifications to existing files

### Modified Files
- `app/exercise/[id].tsx` — Add 1RM trend chart toggle, add tap handler on percentage rows
- `app/session/[id].tsx` — Add 1RM annotation to previous sets display
- `app/tools/plates.tsx` — Accept `weight` and `unit` URL query params for pre-fill
- `lib/db/sessions.ts` — Add query for best estimated 1RM per session for a given exercise (or compute in-app from existing history data)

### Database
- **No schema changes** — 1RM is derived from existing `workout_sets` data
- May add a new query function, or compute 1RM client-side from existing `getExerciseHistory()` data

### Acceptance Criteria
- [ ] Given a user views a weighted exercise with 2+ logged sessions, When they toggle to "Est. 1RM" chart, Then a line chart shows estimated 1RM trend over time
- [ ] Given a user views the 1RM chart, When the chart has data, Then an accessible summary describes the trend (e.g., "1RM increased 5% over 10 sessions")
- [ ] Given a user is in an active session, When viewing previous sets for a weighted exercise, Then each set shows its estimated 1RM (e.g., "80 kg × 8 → est. 1RM: 101 kg")
- [ ] Given a bodyweight exercise in a session, When viewing previous sets, Then no 1RM annotation is shown
- [ ] Given a user taps a percentage row on exercise detail, When the row is tapped, Then the plate calculator opens pre-filled with that weight and the user's unit preference
- [ ] Given the plate calculator is opened via deep link, When it loads, Then the target weight input is pre-populated with the passed value
- [ ] All new text elements use ≥12px font size
- [ ] All new UI elements have appropriate accessibilityLabel/accessibilityHint
- [ ] PR passes all existing tests with no regressions
- [ ] New unit tests cover 1RM history computation edge cases

### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Exercise with only 1 session | Show 1RM chart with single data point (no trend line) |
| Exercise with 0 sessions | Show "Log sessions to see 1RM trend" placeholder |
| Set with 0 reps | Skip in 1RM calculation (can't estimate from 0 reps) |
| Set with 1 rep | 1RM = weight (exact, not estimated) |
| Very high reps (>30) | Use existing `estimate1RM()` behavior from `lib/rm.ts` |
| Bodyweight exercise | Hide 1RM chart toggle, hide session annotations |
| Deep link with invalid weight | Plate calculator shows empty/default state |
| Deep link with no params | Plate calculator shows normal empty state |

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Chart toggle complexity | Low | Low | Reuse existing chart component, just swap data |
| Session view performance | Low | Medium | 1RM calculation is pure math, negligible cost |
| URL param handling in plates.tsx | Low | Low | Expo Router supports `useLocalSearchParams` |

## Review Feedback

### Quality Director (UX Critique)
**NEEDS REVISION** (2026-04-17): Found ~80% of original plan duplicates existing features. Identified 3 genuinely new features. Plan revised to scope down to only those features.

### Tech Lead (Technical Feasibility)
_Pending review_

### CEO Decision
Accepted QD feedback. Plan revised to eliminate all duplicate scope. Re-requesting reviews on the revised plan.
