# Phase 43 — Estimated 1RM Tracking & Plate Calculator

**Issue**: BLD-260 (PLAN)
**Status**: PROPOSED
**Author**: CEO
**Date**: 2026-04-17

## Problem Statement

FitForge tracks workout history and shows personal records (max weight), but lacks two gym-essential features:

1. **Estimated 1RM** — Users have no way to see their estimated one-rep max for each exercise, making it hard to gauge strength progress or plan working sets at target percentages. Every serious strength program (5/3/1, nSuns, GZCL) requires knowing your 1RM.

2. **Plate Calculator** — When loading a barbell, users must mentally calculate which plates to put on each side. This is error-prone, especially with kilo plates. A plate calculator is one of the most-requested features in any gym app.

## Proposed Solution

### Feature A: Estimated 1RM on Exercise Detail Screen

Add an "Estimated 1RM" card to the exercise detail screen (`app/exercise/[id].tsx`) that shows:
- Current estimated 1RM (from best recent set using Epley formula)
- 1RM trend over time (line chart, same style as existing weight chart)
- Percentage table (common percentages: 95%, 90%, 85%, 80%, 75%, 70%, 65%, 60%)

**Formula**: Epley — `1RM = weight × (1 + reps / 30)` (for reps > 1; if reps = 1, 1RM = weight)

**Data source**: Use existing `workout_sets` table — no schema changes. Query best set per session (highest estimated 1RM) for chart data.

### Feature B: Plate Calculator Tool

Add a new tool to the tools screen (`app/tools/`) that:
- Accepts a target weight input
- Shows plates needed per side of a standard barbell (default bar weight: 20 kg / 45 lb)
- Supports both metric (kg) and imperial (lb) plate sets
- Visual plate representation (colored rectangles, standard plate colors)
- Configurable: bar weight, available plate sizes
- Quick-access from the exercise detail screen (tap 1RM percentage → opens plate calculator pre-filled)

### Feature C: 1RM-Based Loading in Sessions

On the session screen, when viewing previous sets, show the estimated 1RM alongside:
- "Previous: 80 kg × 8 (est. 1RM: 101 kg)"
- This helps users contextualize their working weights

## Scope

### In Scope
- Estimated 1RM calculation (Epley formula) as a pure utility function in `lib/`
- 1RM card on exercise detail screen with current estimate + percentage table
- 1RM trend chart on exercise detail screen (reuse existing chart pattern)
- Plate calculator tool screen (new screen in `app/tools/`)
- Plate calculator supports kg and lb (uses user's unit preference from body settings)
- Standard plate sets: kg (25, 20, 15, 10, 5, 2.5, 1.25) and lb (45, 35, 25, 10, 5, 2.5)
- Bar weight configurable (default 20 kg / 45 lb)
- Visual plate display with standard gym colors
- Link from 1RM percentage table → plate calculator (pre-filled weight)
- 1RM annotation on previous sets in session view
- Accessibility: all values announced, chart has text summary

### Out of Scope
- Custom plate inventory management (save which plates user owns)
- Multiple bar types (trap bar, EZ bar) — just standard barbell for now
- Advanced 1RM formulas (Brzycki, Lombardi) — Epley is sufficient and widely accepted
- Auto-progression suggestions — future phase
- 1RM-based program generation — future phase
- Bodyweight exercise 1RM (doesn't apply) — show "N/A" gracefully

### Dependencies
- Existing exercise detail screen (`app/exercise/[id].tsx`)
- Existing tools screen (`app/tools/index.tsx`)
- Existing unit preference system (`lib/units.ts`, body settings)
- Existing chart library (`victory-native`)

## Implementation Details

### New Files
- `lib/oneRepMax.ts` — Pure utility: `estimate1RM(weight, reps)`, `percentageTable(oneRM)`, `calculatePlates(targetWeight, barWeight, availablePlates, unit)`
- `app/tools/plates.tsx` — Plate calculator screen
- `components/EstimatedOneRM.tsx` — 1RM card component for exercise detail
- `__tests__/lib/oneRepMax.test.ts` — Unit tests for calculation logic

### Modified Files
- `app/exercise/[id].tsx` — Add EstimatedOneRM card
- `app/tools/index.tsx` — Add plate calculator entry
- `lib/db/sessions.ts` — Add `getExercise1RMHistory(exerciseId)` query
- `lib/db/index.ts` — Export new query
- `app/session/[id].tsx` — Add 1RM annotation to previous sets display

### Database
- **No schema changes** — all data derived from existing `workout_sets` table
- New query: best estimated 1RM per session for a given exercise

### Acceptance Criteria
- [ ] Given a user views an exercise with logged sets, When the exercise detail loads, Then an "Estimated 1RM" card shows the current estimate calculated from the best recent set
- [ ] Given a user has 2+ sessions for an exercise, When viewing exercise detail, Then a 1RM trend chart shows estimated 1RM over time
- [ ] Given an estimated 1RM is shown, When the user views the percentage table, Then common percentages (60-95%) with corresponding weights are listed
- [ ] Given a user taps a percentage weight, When the plate calculator opens, Then it is pre-filled with that weight
- [ ] Given a user opens the plate calculator tool, When they enter a target weight, Then plates per side are shown with visual representation
- [ ] Given a user with kg preference, When using plate calculator, Then kg plates are used (25, 20, 15, 10, 5, 2.5, 1.25)
- [ ] Given a user with lb preference, When using plate calculator, Then lb plates are used (45, 35, 25, 10, 5, 2.5)
- [ ] Given bar weight is configurable, When user changes bar weight, Then plate calculation updates
- [ ] Given an exercise has no completed sets, When viewing exercise detail, Then 1RM card shows "Log some sets to estimate your 1RM"
- [ ] Given a bodyweight exercise, When viewing exercise detail, Then 1RM estimation is hidden (not applicable)
- [ ] Given a session shows previous sets, When viewing the set row, Then estimated 1RM is annotated (e.g., "est. 1RM: 101 kg")
- [ ] All new UI elements meet 12px minimum font size
- [ ] All values are accessible (screen reader announces weights, percentages, plate counts)
- [ ] PR passes all existing tests with no regressions
- [ ] New unit tests cover 1RM calculation, plate calculation, edge cases (0 reps, very high reps, unachievable weight)

### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| 0 reps logged | Don't estimate — show "Log completed sets" |
| 1 rep logged | 1RM = weight (direct measurement) |
| Very high reps (>30) | Cap at 30 for Epley formula accuracy, note "estimate may be less accurate" |
| Target weight < bar weight | Show "Target weight must exceed bar weight" |
| Target weight not achievable with available plates | Show closest achievable weight + which plates |
| Bodyweight exercise | Hide 1RM card entirely |
| No unit preference set | Default to kg |
| Exercise with only machine/cable sets | Still show 1RM but hide plate calculator link (plates don't apply) |

## Visual Design Notes

### Plate Colors (Standard Gym Convention)
- **kg**: 25=red, 20=blue, 15=yellow, 10=green, 5=white, 2.5=black, 1.25=chrome/silver
- **lb**: 45=blue, 35=yellow, 25=green, 10=white/gray, 5=blue-small, 2.5=green-small

### Plate Calculator Layout
- Target weight input at top
- Bar weight selector (20/15 kg or 45/35 lb)
- Visual: horizontal bar with colored plate rectangles, symmetric
- Text below: "Per side: 20 + 10 + 5 = 35 kg"
- Total confirmation: "Total: 20 (bar) + 35 × 2 (plates) = 90 kg"

## Risk Assessment
- **Low risk**: No schema changes, no existing feature modifications (mostly additive)
- **Medium complexity**: Plate calculator visual needs careful layout for different screen sizes
- **Testing**: Pure calculation logic is easily unit-tested; UI layout needs manual verification

## Review Checklist
- [ ] Quality Director UX critique
- [ ] Tech Lead technical feasibility review
- [ ] CEO final decision
