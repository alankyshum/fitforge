# Phase 13: Per-Set Notes & RPE Tracking

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

- **RPE selector**: A row of tappable chips (6 / 6.5 / 7 / 7.5 / 8 / 8.5 / 9 / 9.5 / 10) that appears BELOW the weight/reps row when the set is completed. Selecting an RPE chip saves immediately via `updateSet`. Tapping the already-selected chip deselects it (sets RPE to null).
- **Notes icon**: A small "note" icon button at the end of the set row. Tapping opens an inline TextInput below the set row (max 200 chars). Saves on blur via `updateSet`. If a note exists, the icon shows a filled variant.
- RPE chips use color coding: 6-7 green (easy), 7.5-8.5 yellow (moderate), 9-10 red (hard).

### 3. DB Layer Changes (`lib/db.ts`)

- `updateSet()`: Accept optional `rpe` and `notes` params. Update the SQL to include these columns.
- `getSessionSets()`: Already returns all columns via `SELECT *` -- no query change needed, but update the TypeScript type.
- `WorkoutSet` type in `lib/types.ts`: Add `rpe: number | null` and `notes: string`.
- Export functions (`exportAllData`, workout CSV): Include `rpe` and `notes` columns.
- Import function: Handle `rpe` and `notes` columns (backward-compatible -- missing columns default to null/'').

### 4. Session Detail Screen (`app/session/detail/[id].tsx`)

Show RPE and notes for completed sets in the read-only session detail view:

- RPE displayed as a colored badge next to the set info (e.g., "RPE 8.5" in yellow).
- Notes displayed as italic text below the set row, only if non-empty.

### 5. Exercise History Screen (`app/exercise/[id].tsx`)

In the history tab (Phase 12), show RPE for each historical set:

- Small RPE badge next to each set in the history list.
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

- [ ] GIVEN a user completes a set WHEN they tap an RPE chip THEN the RPE value (6-10, half-steps) is saved to the set and the chip shows as selected
- [ ] GIVEN a user has selected an RPE WHEN they tap the same RPE chip again THEN the RPE is cleared (set to null)
- [ ] GIVEN a user taps the note icon on a set WHEN they type text (max 200 chars) and blur THEN the note is saved to the set
- [ ] GIVEN a set has RPE and/or notes WHEN the user views session detail THEN RPE badge and notes text are visible
- [ ] GIVEN a set has RPE WHEN the user views exercise history THEN the RPE badge appears next to historical sets
- [ ] GIVEN the user exports workout data THEN RPE and notes columns are included in the CSV
- [ ] GIVEN the user imports a CSV with RPE/notes THEN the values are correctly imported
- [ ] GIVEN a CSV without RPE/notes columns (old format) WHEN imported THEN defaults apply (null RPE, empty notes) -- no crash
- [ ] PR passes TypeScript typecheck with zero errors
- [ ] No regressions in existing functionality

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Set not completed | RPE chips hidden (only show after completion) |
| RPE out of range | UI constrains to 6-10 in 0.5 steps; no free-text entry |
| Note > 200 chars | TextInput maxLength=200 prevents over-entry |
| Existing DB without new columns | Migration adds columns idempotently -- no data loss |
| Old CSV import (no RPE/notes) | Graceful fallback to defaults |
| Set uncompleted after RPE set | RPE value preserved (not cleared) |
| Screen reader | RPE chips have accessibilityLabel "RPE [value]", notes input labeled "Set notes" |

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
