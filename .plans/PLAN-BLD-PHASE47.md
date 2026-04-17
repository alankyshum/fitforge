# Feature Plan: Template Exercise Editing (Phase 47)

**Issue**: BLD-TBD (PLAN)
**Author**: CEO
**Date**: 2026-04-17
**Status**: DRAFT

## Problem Statement

Users cannot edit template exercise parameters (target sets, target reps, rest time) after adding an exercise to a template. The only workaround is to delete the exercise and re-add it with different values, which also loses the exercise's position, superset grouping (`link_id`), and link label.

This is a fundamental UX gap: the `updateTemplateExercise()` database function exists but has no UI entry point. Every user who creates a template and later wants to adjust their sets/reps must delete and re-add — a frustrating multi-step process that loses context.

## User Stories

- As a lifter, I want to tap an exercise in my template to adjust target sets, reps, and rest time without removing it
- As a lifter editing a template, I want to see the current values pre-filled so I can make quick adjustments
- As a lifter, I want my superset groupings and position preserved when I edit exercise parameters

## Proposed Solution

### Overview

Add a tap handler on template exercise rows that opens an inline edit sheet (React Native Paper `Modal` or bottom area expansion) showing the current target sets, target reps, and rest seconds. User edits and saves. Superset groupings, position, and link labels are preserved.

### UX Design

#### Template Detail Screen (app/template/[id].tsx)

**Approach: Tap to open edit bottom sheet**

When a user taps an exercise row (not in superset selection mode):
- A bottom sheet / modal appears showing:
  - Exercise name (read-only, as title)
  - **Target Sets**: Numeric stepper or text input (current value pre-filled)
  - **Target Reps**: Text input supporting range format like "8-12" (current value pre-filled)
  - **Rest Time**: Numeric stepper in seconds, displayed as "Xs" (current value pre-filled)
  - **Save** button and **Cancel** / dismiss
- On save, calls `updateTemplateExercise(id, sets, reps, rest)` and refreshes the list
- Position, link_id, link_label, and exercise_id are NOT changed

**Input specifications:**
- Target Sets: integer ≥ 1, default 3. Use a small numeric input or stepper (- / + buttons around a number).
- Target Reps: free text to support "8-12", "5", "AMRAP", etc. Default "8-12".
- Rest Seconds: integer ≥ 0, in increments of 5 or 15. Default 90. Show as seconds.

**Interaction with existing gestures:**
- **Tap** (not in selection mode): opens edit sheet (NEW)
- **Long-press**: enters superset selection mode (EXISTING — unchanged)
- **Swipe left**: delete exercise (EXISTING — unchanged)

**Accessibility:**
- Edit sheet inputs have `accessibilityLabel`: "Target sets", "Target reps", "Rest time in seconds"
- Save button: `accessibilityRole="button"`, `accessibilityLabel="Save exercise settings"`
- Minimum touch targets: 48×48dp for all interactive elements
- Sheet dismissible via back gesture / backdrop tap

**Visual design:**
- Use React Native Paper `Modal` with `Portal` for the edit sheet
- Match existing app patterns (Paper `TextInput`, `Button` components)
- All colors from theme tokens

#### Template Create Screen (app/template/create.tsx)

Same edit capability should be available here too — tap an added exercise to modify its parameters before saving the template. The create screen already shows the same "X × Y · Zs rest" format.

### Technical Approach

#### 1. No Schema Changes Required

`updateTemplateExercise()` already exists in `lib/db/templates.ts` (line 303). It updates `target_sets`, `target_reps`, and `rest_seconds` by template exercise ID. No migration needed.

#### 2. UI Component (app/template/[id].tsx)

Add state for the edit modal:
```ts
const [editing, setEditing] = useState<TemplateExercise | null>(null)
```

On row tap (when not in selection mode):
```ts
onPress={() => { if (!selecting) setEditing(item); }}
```

Modal renders inputs pre-filled with `editing.target_sets`, `editing.target_reps`, `editing.rest_seconds`.

Save handler:
```ts
await updateTemplateExercise(editing.id, sets, reps, rest)
refetch() // re-query template data
setEditing(null)
```

#### 3. Validation

- Target sets: must be ≥ 1 (integer). Show error if 0 or negative.
- Target reps: non-empty string. Allow "8-12", "5", "AMRAP", "max".
- Rest seconds: must be ≥ 0 (integer).
- Save button disabled until all validations pass.

#### 4. Template Create Screen (app/template/create.tsx)

The create screen manages exercises in local state before persisting. The edit modal pattern is the same but updates local state instead of calling the DB function.

### Testing Plan

| Test | Description |
|------|-------------|
| Edit modal opens on tap | Tap exercise row → modal appears with pre-filled values |
| Save updates DB | Change values → save → verify updateTemplateExercise called correctly |
| Validation | Sets < 1 rejected, empty reps rejected, rest < 0 rejected |
| Position preserved | Edit exercise → position and link_id unchanged |
| Superset mode unaffected | Long-press still enters selection mode |
| Swipe delete unaffected | Swipe left still deletes |
| Create screen edit | Edit exercise on create screen updates local state |

### Out of Scope

- Editing exercise itself (swapping to a different exercise) — use the existing Replace flow for deleted exercises
- Reordering exercises via drag-and-drop — separate future feature
- Per-exercise set type defaults (e.g., "2 warm-up + 3 working") — deferred
- Editing exercise notes/instructions from the template screen

### Dependencies

- None — `updateTemplateExercise()` already exists

### Risks

| Risk | Mitigation |
|------|------------|
| Tap conflicts with superset selection | Tap only opens edit when NOT in selection mode (long-press enters selection) |
| Modal may feel heavy for a simple edit | Keep modal minimal — 3 fields + save/cancel. Consider inline expansion as alternative if review feedback prefers it. |

### Estimated Complexity

- **Schema**: None
- **DB layer**: None (function exists)
- **UI**: Low-Medium (modal with 3 inputs, validation, two screens)
- **Tests**: Low (straightforward input/output)
- **Overall**: Low — mostly UI work using existing patterns and DB functions

### Files to Modify

1. `app/template/[id].tsx` — Add tap handler and edit modal
2. `app/template/create.tsx` — Same edit capability for pre-save exercises
3. New test file for template exercise editing
