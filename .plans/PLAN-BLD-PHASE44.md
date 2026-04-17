# Feature Plan: Repeat Workout from History (Phase 44)

**Issue**: BLD-264 (PLAN)
**Author**: CEO
**Date**: 2026-04-17
**Status**: DRAFT

## Problem Statement

Users who complete a workout often want to repeat it next week with the same exercises and similar weights. Currently, the only way to achieve this is:
1. Save the session as a template first (via "Save as Template" on session detail)
2. Then start a new session from that template

This is a two-step process that creates template clutter — users accumulate templates they never reuse. Many users follow an informal routine (e.g., "Push Day") without formal templates. They simply want a "do it again" button that starts a new session pre-filled with the same exercises and their last-used weights.

Competitive apps (Strong, Hevy, JEFIT) all offer one-tap workout repetition from history. This is one of the most requested features in fitness app communities.

## User Stories

- As a user viewing a past workout in session detail, I want to tap "Repeat" so that a new session starts pre-filled with the same exercises and target weights
- As a user viewing the session summary after completing a workout, I want to repeat that workout later without creating a template first
- As a user, I want the repeated session to show my previous performance as reference so I can track progressive overload

## Proposed Solution

### Overview

Add a "Repeat Workout" action to two screens:
1. **Session Detail** (`app/session/detail/[id].tsx`) — "Repeat" button in the action row alongside existing "Save as Template"
2. **Session Summary** (`app/session/summary/[id].tsx`) — "Repeat" option (for future — focus this phase on session detail only to keep scope small)

When tapped, the system:
1. Creates a new session via existing `startSession(null, sessionName)`
2. Navigates to the active session screen (`app/session/[id].tsx`) with a new `sourceSessionId` URL param
3. The session screen detects `sourceSessionId`, loads exercises from the source session, creates matching sets, and pre-fills target weights from the source session's actual performance

This follows the exact same pattern as the existing template-based population (lines 887-921 of `app/session/[id].tsx`), substituting session history data for template data.

### UX Design

**Session Detail Screen** — Add a "Repeat" icon button (MaterialCommunityIcons `repeat`) in the existing header action row, next to the overflow menu. Tapping it:
1. Checks for an active session (same guard as template-based start)
2. If active session exists → Alert: "You have an active workout. Finish or cancel it first."
3. If no active session → Creates new session, navigates to `/session/[newId]?sourceSessionId=[oldId]`

**Repeated Session Behavior:**
- Session name: same as source session name (e.g., "Push Day")
- Sets: same exercises, same number of sets per exercise, same link_id groupings (supersets/circuits)
- Target weight: pre-filled from source session's completed weights (same as template flow uses `getPreviousSets`)
- Target reps: NOT pre-filled (left blank, as current template flow does)
- Training mode and tempo: copied from source session sets
- Notes: NOT copied (start fresh)

**Edge Cases Handled:**
- Deleted exercises: Skip exercises that have been deleted since the source session. Show a snackbar: "N exercises were skipped (deleted)"
- Empty source: If source session has no completed sets, create the session with the exercises but no pre-filled weights

### Technical Approach

**Changes required:**

1. **`app/session/[id].tsx`** — Accept new `sourceSessionId` URL param. Add population logic parallel to the existing `templateId` branch (lines 887-921):
   ```
   if (sourceSessionId) {
     // Load sets from source session
     // Group by exercise_id
     // Create matching sets via addSetsBatch
     // Pre-fill weights from source session's actual weights
   }
   ```

2. **`app/session/detail/[id].tsx`** — Add "Repeat" button that:
   - Checks for active session via `getActiveSession()`
   - Creates new session via `startSession(null, session.name)`
   - Navigates to `/session/${newId}?sourceSessionId=${id}`

3. **`lib/db/sessions.ts`** — Add a helper function `getSessionExerciseGroups(sessionId)` that returns the exercise groups (exercise_id, set_count, link_id, training_mode, tempo) for replication. This avoids the session screen needing to parse raw sets.

**No new dependencies.** No schema changes. No new screens.

### Scope

**In Scope:**
- "Repeat" button on session detail screen
- Session population from source session history
- Weight pre-fill from source session
- Superset/circuit preservation (link_id)
- Training mode and tempo preservation
- Deleted exercise handling

**Out of Scope:**
- "Repeat" on session summary screen (can add later — keep this phase small)
- Modifying the repeated workout before starting (add/remove exercises)
- "Repeat with progressive overload" (auto-increment weights) — future enhancement
- Search/filter in session history

### Acceptance Criteria

- [ ] Given a completed session detail, When user taps "Repeat", Then a new session is created with the same exercises and number of sets
- [ ] Given the new session, When it loads, Then weights are pre-filled from the source session's completed weights
- [ ] Given a source session with supersets, When repeated, Then the new session preserves superset groupings (link_id)
- [ ] Given a source session containing deleted exercises, When repeated, Then deleted exercises are skipped and a snackbar notifies the user
- [ ] Given an active session exists, When user taps "Repeat", Then an alert prevents creating a duplicate active session
- [ ] Given a source session with training modes (tempo, etc.), When repeated, Then modes are preserved in the new session
- [ ] PR passes all existing tests with no regressions
- [ ] No new lint warnings

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Source session has deleted exercises | Skip deleted exercises, show snackbar with count |
| Active session already exists | Alert user, do not create new session |
| Source session has 0 completed sets | Create session with exercises but no pre-filled weights |
| Source session has supersets/circuits | Preserve link_id groupings |
| Source session has training modes | Preserve training_mode and tempo on new sets |
| Very large session (20+ exercises) | Works normally — addSetsBatch handles bulk inserts |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Navigation conflict with active session | Low | Medium | Existing guard pattern from template flow |
| Link_id collision in new session | Low | Low | Use existing uuid() for new link_ids, map old→new |

## Review Feedback

### Quality Director (UX Critique)
_Pending review_

### Tech Lead (Technical Feasibility)
_Pending review_

### CEO Decision
_Pending reviews_
