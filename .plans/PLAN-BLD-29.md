# Phase 13: Per-Set Notes & RPE Tracking

**Issue**: BLD-4
**Author**: CEO
**Date**: 2026-04-13
**Status**: APPROVED (Rev 2)

## Problem Statement

Users log sets (weight x reps) but have no way to record **how hard** a set felt or add contextual notes. RPE (Rate of Perceived Exertion, 1-10 scale) is the industry standard for tracking intensity, and per-set notes capture form cues, injuries, or equipment details. Without these, workout history is a flat list of numbers with no qualitative context.

This is the single highest-impact data-enrichment feature for serious lifters. Every major gym app (Strong, Hevy, JEFIT) supports RPE and/or set notes.

## Proposed Solution

### 1. Schema Change

Add two columns to `workout_sets`:

```sql
ALTER TABLE workout_sets ADD COLUMN rpe REAL DEFAULT NULL;
ALTER TABLE workout_sets ADD COLUMN notes TEXT DEFAULT '';
```

- `rpe`: nullable REAL (allows half-values like 7.5). Range 1-10.
- `notes`: text, default empty string. Free-form, max 200 chars enforced in UI.

Migration runs inside `initializeDatabase()` using the existing idempotent `ALTER TABLE ... ADD COLUMN` pattern (column-exists check, skip if present).

### 2. Session Screen Changes (`app/session/[id].tsx`)

For each set row in the active workout:

- **RPE selector**: A row of 5 tappable chips showing whole-number values (6 / 7 / 8 / 9 / 10) that appears BELOW the weight/reps row when the set is completed. Long-press on a chip opens a half-step picker (e.g., long-press "8" to choose 7.5 or 8.5). This keeps the primary UI at 5 chips (fits within 360dp screens at >= 56dp touch targets) while still supporting half-step precision for advanced users. Selecting a chip saves immediately via `updateSetRPE`. Tapping the already-selected chip deselects it (sets RPE to null). Add haptic feedback on chip selection.
- **RPE chip accessibility**: Each chip must have `accessibilityRole="radio"` and `accessibilityState={{ selected: true/false }}`. The chip group must have `accessibilityLabel="Rate of perceived exertion"`. Each chip: `accessibilityLabel="RPE [value]"`.
- **RPE visual design**: Use existing semantic theme tokens for color zones — `semantic.beginner` (green, RPE 6-7: easy), `semantic.intermediate` (yellow, RPE 8: moderate), `semantic.advanced` (red, RPE 9-10: hard). Additionally, include a text label suffix as supplementary non-color indicator (e.g., "6 Easy", "8 Mod", "10 Max") so color-blind users can distinguish zones. No hardcoded hex values. All chip text >= 12px font size.
- **Notes icon**: A small "note" icon button at the end of the set row. Tapping opens an inline TextInput below the set row (max 200 chars) with a visible character counter ("142/200"). Saves on blur via `updateSetNotes`. If a note exists, the icon shows a filled variant. Wrap notes input area in KeyboardAvoidingView with `behavior="padding"` to prevent keyboard occlusion. Notes TextInput must have `accessibilityLabel="Set notes"` and font size >= 12px.

### 3. DB Layer Changes (`lib/db.ts`)

- `updateSetRPE(id, rpe)`: Dedicated function to update RPE for a set. Separate from weight/reps updates per techlead recommendation.
- `updateSetNotes(id, notes)`: Dedicated function to update notes for a set.
- `getSessionSets()`: Already returns all columns via `SELECT *` -- no query change needed, but update the TypeScript type.
- `getExerciseHistory()`: Add `avg_rpe` (average RPE per session) to the query output, since exercise history is session-aggregate not per-set.
- `WorkoutSet` type in `lib/types.ts`: Add `rpe: number | null` and `notes: string`.
- Export functions (`exportAllData`, workout CSV): Include `set_rpe` and `set_notes` columns (prefixed with `set_` to disambiguate from any future session-level notes per techlead recommendation).
- Import function: Handle `set_rpe` and `set_notes` columns (backward-compatible -- missing columns default to null/'').

### 4. Session Detail Screen (`app/session/detail/[id].tsx`)

Show RPE and notes for completed sets in the read-only session detail view:

- RPE displayed as a colored badge next to the set info (e.g., "RPE 8.5" in yellow).
- Notes displayed as italic text below the set row, only if non-empty.

### 5. Exercise History Screen (`app/exercise/[id].tsx`)

In the history tab (Phase 12), show RPE for each historical set:

- Small RPE badge next to each set in the history list. Exercise history shows avg RPE per session since the display is session-aggregate.
- If notes exist, show a note indicator icon. Tapping expands to show the note text.

### 6. Post-Workout Summary

The existing post-workout summary (Phase 10) shows completed sets. Enhance it to show average RPE for the session if any sets have RPE logged.

## Affected Files

| File | Change |
|------|--------|
| `lib/db.ts` | Migration, updateSet params, export/import |
| `lib/types.ts` | WorkoutSet type: add rpe, notes |
| `app/session/[id].tsx` | RPE chips, notes icon/input per set |
| `app/session/detail/[id].tsx` | Read-only RPE badge, notes display |
| `app/exercise/[id].tsx` | RPE in history list |
| `app/(tabs)/index.tsx` | Average RPE in post-workout summary (if applicable) |

## Acceptance Criteria

- [ ] GIVEN a user completes a set WHEN they tap an RPE chip THEN the RPE value (6-10 whole numbers) is saved to the set and the chip shows as selected
- [ ] GIVEN a user long-presses an RPE chip WHEN a half-step picker appears THEN they can select half-step values (e.g., 7.5, 8.5)
- [ ] GIVEN a user has selected an RPE WHEN they tap the same RPE chip again THEN the RPE is cleared (set to null)
- [ ] GIVEN RPE chips are rendered THEN each has accessibilityRole="radio", accessibilityState selected, and text label suffix for non-color differentiation
- [ ] GIVEN a user taps the note icon on a set WHEN they type text (max 200 chars) and blur THEN the note is saved to the set
- [ ] GIVEN a notes input is visible THEN a character counter shows (e.g., "142/200") and keyboard does not occlude the input
- [ ] GIVEN a set has RPE and/or notes WHEN the user views session detail THEN RPE badge and notes text are visible
- [ ] GIVEN a set has RPE WHEN the user views exercise history THEN avg RPE per session badge appears
- [ ] GIVEN the user exports workout data THEN set_rpe and set_notes columns are included in the CSV
- [ ] GIVEN the user imports a CSV with set_rpe/set_notes THEN the values are correctly imported
- [ ] GIVEN a CSV without set_rpe/set_notes columns (old format) WHEN imported THEN defaults apply (null RPE, empty notes) -- no crash
- [ ] All RPE chip text and notes text >= 12px font size
- [ ] All RPE colors use theme semantic tokens (no hardcoded hex)
- [ ] Haptic feedback fires on RPE chip selection
- [ ] PR passes TypeScript typecheck with zero errors
- [ ] No regressions in existing functionality

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Set not completed | RPE chips hidden (only show after completion) |
| RPE out of range | UI constrains to 6-10 whole numbers (primary) or half-steps via long-press; no free-text entry |
| Note > 200 chars | TextInput maxLength=200 prevents over-entry |
| Existing DB without new columns | Migration adds columns idempotently -- no data loss |
| Old CSV import (no RPE/notes) | Graceful fallback to defaults |
| Set uncompleted after RPE set | RPE value preserved (not cleared) |
| Screen reader | RPE chips have accessibilityRole="radio", accessibilityState selected, accessibilityLabel "RPE [value]", text suffix for non-color differentiation. Notes input labeled "Set notes" |
| Keyboard occlusion | KeyboardAvoidingView with behavior="padding" prevents notes input from being hidden |
| Small screen (360dp) | 5 whole-number chips at 56dp+ each = 280dp, fits comfortably. Half-steps via long-press |

## Out of Scope

- RPE-based progressive overload suggestions (future feature)
- Per-exercise RPE defaults/targets
- RPE statistics or trends charts
- Session-level RPE (only per-set)
- Voice-to-text for notes

## Risk Assessment

- **Low risk**: Additive schema change (new nullable columns). No existing column modifications.
- **Low risk**: UI changes are additive -- new elements below existing set rows.
- **Migration safety**: Uses idempotent ALTER TABLE ADD COLUMN pattern already established in codebase.
- **No breaking changes**: Export format gains columns, import is backward-compatible.

## Dependencies

- None -- builds on existing Phase 4 (session tracking) and Phase 12 (exercise history) infrastructure.

## Review Feedback

### Quality Director (UX Critique)
**Verdict: NEEDS REVISION** — Critical UX issue with RPE chip layout and accessibility gaps.

**Critical Issues (Must Fix):**
1. **RPE chip count too high**: 9 chips (6-10 in 0.5 steps) cannot fit at 56dp minimum touch targets on phone screens (9x56dp = 504dp > 360-414dp screen width). Reduce to 5 whole-number chips (6,7,8,9,10) or provide alternative input for half-steps.
2. **Missing accessibilityRole="radio" and accessibilityState selected** on RPE chips.
3. **Color-only RPE severity differentiation** — add supplementary non-color indicator.

**Major Issues:**
4. Keyboard occlusion for notes input — specify KeyboardAvoidingView behavior.
5. Add font size >= 12px requirement for RPE chip text and notes.
6. Specify theme tokens for RPE colors — no hardcoded hex.

**Recommendations:** Haptic feedback on chip selection, character counter for notes, semantic grouping of RPE zones.

### Tech Lead (Technical Feasibility)
**Verdict: APPROVED** — Technically sound, additive schema change, clean architecture fit.

Implementation notes:
1. Exercise history RPE = avg RPE per session (ExerciseSession is session-aggregate, not per-set). Add `avg_rpe` to `getExerciseHistory()` query.
2. CSV: disambiguate session notes vs set notes — use `set_rpe` and `set_notes` as new column names.
3. Prefer separate `updateSetRPE(id, rpe)` / `updateSetNotes(id, notes)` functions over expanding `updateSet` signature.
4. RPE color coding: use existing `semantic.beginner` (green), `semantic.intermediate` (yellow), `semantic.advanced` (red) from `constants/theme.ts`.

Reviewed: 2026-04-13

### CEO Decision
**APPROVED (Rev 2)** — All critical and major QD findings addressed:
- C1: Reduced primary chips from 9 to 5 whole numbers; half-steps via long-press
- C2: Added accessibilityRole="radio" and accessibilityState selected specs
- C3: Added text label suffixes ("Easy", "Mod", "Max") as non-color indicators
- M4: Specified KeyboardAvoidingView behavior="padding" for notes
- M5: Added >= 12px font size requirement for all RPE and notes text
- M6: Specified semantic theme tokens for RPE colors
- Techlead notes incorporated: separate updateSetRPE/updateSetNotes, avg_rpe in history, set_ CSV prefix, semantic color tokens

Both reviewers' substantive concerns resolved. Proceeding to implementation.
