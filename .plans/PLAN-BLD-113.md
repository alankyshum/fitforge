# Feature Plan: Workout Calendar & Streak Heatmap

**Issue**: BLD-113
**Author**: CEO
**Date**: 2026-04-15
**Status**: DRAFT

## Problem Statement

FitForge's history screen (`app/history.tsx`) shows a basic monthly calendar with dot indicators and a session list. The progress tab shows weekly bar charts. Neither provides a **motivational, at-a-glance view of long-term workout consistency** — the #1 predictor of fitness results.

Users who track workouts want to SEE their consistency pattern over months. GitHub's contribution heatmap proves this pattern: a color-coded grid creates positive reinforcement loops. Currently, FitForge's streak counter (shown on the Workouts tab) is a single number with no visual context.

## User Stories

- As a user, I want to see a color-coded heatmap of my workout history so I can visualize my consistency over months
- As a user, I want to see my current and longest streaks prominently displayed so I feel motivated to maintain them
- As a user, I want to tap a day on the heatmap to see what I did that day so I can review past workouts
- As a user, I want month and year navigation so I can look back at my history

## Proposed Solution

### Overview

**Replace the existing `app/history.tsx` screen** with an enhanced version that adds a GitHub-style contribution heatmap above the existing session list. This approach:
- Reuses the existing history screen navigation (already registered as stack screen)
- Keeps the existing monthly calendar + session list functionality
- Adds heatmap + streak summary as a new section at the top
- No new tabs, no new navigation — just an enhanced existing screen

### UX Design

**Entry point**: Same as today — navigate to `/history` from the Workouts tab.

**Screen layout (top to bottom):**

1. **Streak Summary Bar** (always visible)
   - Current streak (weeks): 🔥 icon + count + "weeks" label
   - Longest streak (weeks): 🏆 icon + count + "weeks" label  
   - Total workouts: 💪 icon + count
   - Horizontal row, evenly spaced, using `Card` surface

2. **Heatmap Section** (collapsible, default expanded)
   - Header: "Last 16 Weeks" with expand/collapse toggle
   - 7 rows (Mon–Sun) × 16 columns (weeks), newest on right
   - Each cell colored by session count that day:
     - 0 sessions: `theme.colors.surfaceVariant` (very subtle)
     - 1 session: `theme.colors.primaryContainer` (light primary)
     - 2 sessions: `theme.colors.primary` at 70% opacity
     - 3+ sessions: `theme.colors.primary` at 100%
   - Day labels (M, T, W, T, F, S, S) on left column
   - Tapping a cell navigates focus to that day in the monthly calendar below

3. **Monthly Calendar** (existing — enhanced)
   - Same month navigation as today (prev/next arrows)
   - Same dot indicators on workout days
   - Same tap-to-filter behavior
   - NEW: Cells with workouts get a subtle background tint (consistent with heatmap colors)

4. **Session List** (existing — unchanged)
   - Same filtered list with search
   - Same session cards showing name, duration, set count

### Data Model

**No new tables needed.** All data comes from existing `workout_sessions` table.

**New DB queries needed:**

```typescript
// Get all session dates in a date range (for heatmap)
// Returns Map<YYYY-MM-DD, count>
async function getSessionCountsByDay(
  startTs: number, 
  endTs: number
): Promise<Map<string, number>>

// Get longest streak (weeks) — similar to computeStreak but finds max
function computeLongestStreak(timestamps: number[]): number

// Get total completed sessions count
async function getTotalSessionCount(): Promise<number>
```

### Implementation Details

#### Heatmap Grid Component

Create a reusable `WorkoutHeatmap` component:

```
components/WorkoutHeatmap.tsx
```

**Props:**
- `data: Map<string, number>` — day → session count
- `weeks: number` — how many weeks to show (default 16)
- `onDayPress?: (date: string) => void` — callback for cell tap

**Rendering:**
- Pure React Native `View` components (no chart library needed — it's a simple grid)
- 7 rows × N columns, each cell is a rounded square
- Cell size calculated from screen width: `Math.floor((width - dayLabelWidth - padding) / weeks)`
- Minimum cell size: 14px, maximum: 24px
- Gap between cells: 2px

**Color scale:**
```typescript
function heatmapColor(count: number, theme: MD3Theme): string {
  if (count === 0) return theme.colors.surfaceVariant;
  if (count === 1) return theme.colors.primaryContainer;
  if (count === 2) return withOpacity(theme.colors.primary, 0.7);
  return theme.colors.primary;
}
```

#### Streak Calculation Enhancement

Add `computeLongestStreak` to `lib/format.ts`:

```typescript
export function computeLongestStreak(timestamps: number[]): number {
  if (timestamps.length === 0) return 0;
  const weeks = new Set(timestamps.map((ts) => mondayOf(new Date(ts))));
  const sorted = Array.from(weeks).sort((a, b) => a - b);
  let max = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i] - sorted[i - 1];
    if (diff === 7 * 24 * 60 * 60 * 1000) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  return max;
}
```

#### New DB Query

Add to `lib/db/sessions.ts`:

```typescript
export async function getSessionCountsByDay(
  startTs: number,
  endTs: number
): Promise<{ date: string; count: number }[]> {
  return query<{ date: string; count: number }>(
    `SELECT date(started_at / 1000, 'unixepoch', 'localtime') AS date,
            COUNT(*) AS count
     FROM workout_sessions
     WHERE completed_at IS NOT NULL
       AND started_at >= ? AND started_at < ?
     GROUP BY date
     ORDER BY date ASC`,
    [startTs, endTs]
  );
}

export async function getTotalSessionCount(): Promise<number> {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM workout_sessions WHERE completed_at IS NOT NULL"
  );
  return row?.count ?? 0;
}
```

### Acceptance Criteria

- [ ] Streak summary bar shows current streak, longest streak, and total workouts
- [ ] Heatmap shows last 16 weeks of workout data with 4-level color scale
- [ ] Heatmap cells are tappable — tapping scrolls to that day's month view and filters
- [ ] Heatmap respects theme (light/dark mode) — colors derive from theme tokens
- [ ] Monthly calendar cells get subtle background tint on workout days (consistent with heatmap)
- [ ] All existing history.tsx functionality preserved (search, month nav, session list)
- [ ] Responsive: heatmap scales on tablet (larger cells, more spacing)
- [ ] Empty state: heatmap shows all-grey grid with encouraging message
- [ ] Longest streak calculation is accurate (handles gaps correctly)
- [ ] Screen loads fast — heatmap data fetched with single query
- [ ] PR passes all existing tests with no regressions
- [ ] New tests: streak summary rendering, heatmap color logic, date calculations

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No workouts ever | Heatmap all grey, streaks = 0, total = 0, encouraging CTA |
| First workout today | Heatmap shows 1 colored cell, streak = 1 week |
| Multiple workouts same day | Cell uses darkest color level, count shown in tooltip/press |
| Very old account (years) | Only last 16 weeks shown by default, heatmap doesn't load all history |
| Timezone edge | Use local timezone for date bucketing (matching existing behavior) |
| Screen resize (rotation) | Heatmap re-renders with recalculated cell sizes |
| 3+ sessions in a day | Uses max color intensity (same as 3) |

### Out of Scope

- Yearly heatmap view (GitHub-style full year) — future enhancement
- Sharing heatmap as image — future enhancement
- Daily streak (vs weekly) — keep consistent with existing computeStreak
- Workout type filtering on heatmap — future enhancement
- Swipe gestures on heatmap — too complex for first iteration

### Dependencies

- None — all infrastructure exists (DB queries, format helpers, theming)

### File Changes

| File | Change |
|------|--------|
| `components/WorkoutHeatmap.tsx` | NEW — reusable heatmap grid component |
| `app/history.tsx` | MODIFY — add streak summary + heatmap section above existing calendar |
| `lib/format.ts` | MODIFY — add `computeLongestStreak` function |
| `lib/db/sessions.ts` | MODIFY — add `getSessionCountsByDay`, `getTotalSessionCount` |
| `__tests__/lib/format.test.ts` | MODIFY — add tests for `computeLongestStreak` |
| `__tests__/components/WorkoutHeatmap.test.tsx` | NEW — unit tests for heatmap component |

### Risk Assessment

**Low risk** — this feature:
- Adds no new dependencies
- Modifies only one existing screen (history.tsx) with additive changes
- Adds 2 simple DB queries using existing patterns
- Uses only standard React Native Views (no complex graphics)
- Cannot break existing functionality if implemented as additive sections

### Estimated Complexity

- **Implementation**: Medium (1 new component, 1 screen enhancement, 2 DB queries)
- **Testing**: Low (pure functions + component rendering)
- **Review risk**: Low (no architectural changes)
