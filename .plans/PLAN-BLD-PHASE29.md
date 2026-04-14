# Feature Plan: Visual Polish & Volta 1 Identity (Phase 29)

**Issue**: BLD-78
**Author**: CEO
**Date**: 2026-04-14
**Status**: APPROVED (2026-04-14)

## Problem Statement

Board goal: "User interface is very plain and verbose; leverage more graphics to stand out in the competitive market of workout apps." Additionally: "There's no workout planner app specifically designed for Beyond Power Volta 1 — that device has unique features especially eccentric muscle training."

The home screen is text-heavy with minimal visual distinction between elements. The exercise library shows categories and muscles as plain text chips with no icons. Volta 1 exercises exist in the database (`is_voltra`, `mount_position`, `attachment`, `training_modes`) but have no visual distinction in the exercise list — users can't quickly identify cable-machine exercises.

## User Stories

- As a user, I want to see my workout streak and weekly stats at a glance on the home screen so I stay motivated
- As a Volta 1 owner, I want to quickly filter exercises compatible with my cable machine so I can build workouts efficiently
- As a user, I want muscle group icons next to exercise categories so I can visually scan the exercise library faster
- As a user, I want visual difficulty indicators so I can gauge exercise complexity at a glance

## Proposed Solution

### Overview

Three focused visual improvements that transform the most-seen screens from text-heavy to graphically rich, using only existing dependencies (MaterialCommunityIcons, React Native Paper):

1. **Home Stats Row** — Compact stat cards at top of home screen
2. **Category & Volta Icons** — Icon mapping for exercise categories + Volta 1 badge
3. **Exercise Card Enhancement** — Difficulty color bar + equipment icon + Volta badge

### UX Design

#### 1. Home Stats Row (above existing banners)

A horizontal row of 3 compact stat cards:

| Stat | Icon | Value | Subtitle |
|------|------|-------|----------|
| Streak | `fire` | `4` | "weeks" |
| This Week | `dumbbell` | `3/5` | "workouts" |
| Recent PRs | `trophy` | `2` | "this week" |

Design:
- Cards use `surface` background with `primaryContainer` icon tint
- Fixed height ~72px, equal width (flex: 1), 8px gap between
- Icon (24px) left-aligned, value (titleLarge) center, subtitle (bodySmall) below value
- Entire row scrolls with page (not sticky)
- When no data (streak=0, no sessions): show "0" with muted colors, not hidden
- **REPLACES existing streak card (index.tsx L778-793) and Recent PRs card (L797-850)**. Remove both existing cards — the stats row consolidates this data into a compact format. The individual PR exercise list is dropped (PR count is sufficient for motivation).
- Each stat card has an `accessibilityLabel` (e.g., "4 week streak", "3 of 5 workouts this week", "2 personal records this week")

#### 2. Category Icon Map

Add icons to exercise category filter chips and list item category badges:

| Category | Icon Name | Rationale |
|----------|-----------|-----------|
| abs_core | `stomach` | Direct body part |
| arms | `arm-flex` | Bicep curl motion |
| back | `human-handsup` | Lat spread |
| chest | `weight-lifter` | Bench press |
| legs_glutes | `walk` | Leg motion |
| shoulders | `account-arrow-up` | Overhead motion |

Implementation:
- New constant `CATEGORY_ICONS: Record<Category, string>` in `constants/theme.ts`
- Filter chips in exercises.tsx: prepend icon (16px) before label text
- Exercise list item: replace plain category chip with icon + label chip

#### 3. Volta 1 Badge & Filter

**Filter chip**: Add a "Volta 1" filter chip to the exercise list filter bar (after category chips). When active, filters to `is_voltra === true` exercises only (strict equality — field is `boolean | undefined`). When both Volta filter and a category filter are active, they compose as AND (intersection) — only Volta exercises in the selected category are shown.

**List badge**: Exercises with `is_voltra === true` show a small rounded text badge "V1" (14px, `tertiary` color background, `onTertiary` text) in the title row. Placed after the exercise name, before the Custom chip. On narrow screens, if the exercise name + V1 badge + Custom chip exceed the available width, the exercise name truncates with ellipsis (numberOfLines={1}). Badge has `accessibilityLabel="Volta 1 compatible"`.

> **Note**: The DB field is `is_voltra` (typo preserved for compatibility) but the UI shows "Volta 1".

**Detail screen**: Already shows mount position, attachment, and training modes — no changes needed.

#### 4. Difficulty Color Bar

Add a 3px left border to exercise list items colored by difficulty, plus a small text label for accessibility:

| Difficulty | Color | Label | Existing constant |
|-----------|-------|-------|-------------------|
| beginner | `semantic.beginner` | "B" | Already in theme |
| intermediate | `semantic.intermediate` | "I" | Already in theme |
| advanced | `semantic.advanced` | "A" | Already in theme |

The color bar provides instant visual scanning. The text label (single letter, 10px, placed at the bottom of the color bar or beside it) ensures colorblind users can distinguish difficulty levels — **color is never the sole indicator** (SKILL [C] compliance). Each difficulty bar has `accessibilityLabel="Difficulty: beginner"` (or intermediate/advanced).

### Technical Approach

**Files modified** (estimated):
- `constants/theme.ts` — Add `CATEGORY_ICONS` map (~10 lines)
- `app/(tabs)/index.tsx` — Add stats row component above banners (~60 lines)
- `app/(tabs)/exercises.tsx` — Add Volta filter chip, update category chips with icons, add difficulty border + label, add Volta V1 text badge (~50 lines changed)
- No new files, no new dependencies

**Architecture**: All changes are presentational. No data model changes. No new DB queries — all data already fetched (streak, sessions, PRs in index.tsx; is_voltra in exercises.tsx).

**Performance**: Negligible — adding a few icons and a 3px border. Stats row uses data already loaded. No new network calls.

### Scope

**In Scope:**
- Home screen stats row (streak, weekly workouts, recent PRs) — **replaces** existing streak card and PR card
- Category icons on exercise filter chips and list item category badges
- Volta 1 filter chip and exercise list V1 text badge
- Difficulty color bar + text label on exercise list items
- Dark mode compatibility (all changes must work in both themes)
- Accessibility labels on all new visual elements

**Out of Scope:**
- Muscle group illustration SVGs (future phase — requires asset creation)
- Exercise detail screen changes (already has Volta info)
- Home screen layout restructuring beyond streak/PR card consolidation
- New DB queries or data model changes
- Animated transitions or micro-interactions
- Template/program card redesign (future phase)
- Navigation or screen flow changes

### Acceptance Criteria

- [ ] Given the home screen loads, When the user has workout data, Then a stats row showing streak (with fire icon), weekly workout count, and recent PR count is visible above the banners
- [ ] Given the home screen loads, When streak is 0, Then the streak card shows "0" with muted styling (not hidden)
- [ ] Given the exercise list loads, When viewing filter chips, Then each category chip shows its corresponding Material icon (16px) before the label text
- [ ] Given the exercise list loads, When the user taps the "Volta 1" filter chip, Then only exercises with is_voltra=true are shown
- [ ] Given the exercise list loads, When an exercise has is_voltra===true, Then a rounded "V1" text badge (tertiary color) appears in the title row with accessibilityLabel="Volta 1 compatible"
- [ ] Given the exercise list loads, When viewing any exercise item, Then a 3px left border in the difficulty color (beginner=green, intermediate=yellow, advanced=red) plus a single-letter text label (B/I/A) is visible
- [ ] Given the exercise list loads, When both Volta filter and a category filter are active, Then only exercises matching BOTH criteria are shown (AND composition)
- [ ] Given dark mode is active, When viewing stats row, filter chips, and exercise cards, Then all icons and colors have adequate contrast (use theme-aware colors only)
- [ ] All new visual elements (stats cards, V1 badge, difficulty bar) have accessibilityLabel attributes for screen reader support
- [ ] Given the home screen loads, When the stats row is rendered, Then the existing streak card (L778-793) and PR card (L797-850) are removed — no duplicate display
- [ ] All existing 268 tests pass with zero regressions
- [ ] npx tsc --noEmit passes with zero type errors
- [ ] No new dependencies added
- [ ] Stats row renders correctly on both phone (375px) and tablet (768px+) widths

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Zero streak (new user) | Stats row shows "0 weeks" with muted icon color |
| No workouts this week, no schedule | Shows "0 workouts" (no denominator) |
| No workouts this week, has schedule | Shows "0/5 workouts" (schedule count as denominator) |
| No PRs | Shows "0 this week" |
| No Volta exercises in DB | "Volta 1" chip appears but filtering shows empty state message |
| Dark mode | All icons use theme-aware colors, no hardcoded colors |
| Tablet layout | Stats cards flex to fill width, maintain proportions |
| Exercise with no difficulty | Default to intermediate color (yellow) and label "I" |
| Exercise with is_voltra=true but difficulty null | Show V1 badge + default intermediate difficulty bar/label |
| Long exercise name + V1 badge + Custom chip | Exercise name truncates with ellipsis (numberOfLines={1}); badges never wrap to second line |
| Volta filter + category filter active | AND composition — only Volta exercises in selected category shown |
| RTL layout | Icons/badges use flexDirection (respects RTL automatically in RN); no absolute positioning |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Icon names incorrect | Low | Low | Verify against MaterialCommunityIcons catalog before implementation |
| Stats row crowds home screen | Low | Medium | Keep compact (72px height max), test with full data |
| Volta filter empty (no Volta exercises) | Medium | Low | Show empty state message, not a crash |
| Difficulty color not visible on colored backgrounds | Low | Medium | Use left border (not background), works on any card background |

## Review Feedback

### Quality Director (UX Critique)

**Verdict: APPROVED** (2026-04-14, Rev 2)

All 3 Critical and 3 Major issues from Rev 1 review resolved in Rev 2:
1. ✅ Duplicate streak/PR cards → replaced by stats row (not duplicated)
2. ✅ Color-only difficulty bar → text label (B/I/A) added as secondary channel
3. ✅ Missing a11y labels → accessibilityLabel on all new elements
4. ✅ Misleading cable-data icon → "V1" text badge
5. ✅ "0/0 workouts" → "0 workouts" (no schedule) / "0/5" (has schedule)
6. ✅ Filter composition → AND specified

Minor notes (non-blocking):
- Difficulty text label at 10px is sub-12px — acceptable for single-letter supplementary indicator
- Category icons (human-handsup, account-arrow-up) are unintuitive — future iteration

### Tech Lead (Technical Feasibility)
**Verdict: APPROVED** (2026-04-14, Rev 2)

- All icon names verified against MaterialCommunityIcons glyphmap — all exist
- No new dependencies needed; data already loaded in `load()` Promise.all batch
- Architecture fit: compatible, purely presentational, no refactoring needed
- Effort: Small (~120 lines, 3 files), Risk: Low

All Rev 1 issues resolved in Rev 2:
- ✅ Streak/PR cards explicitly replaced (not duplicated) by stats row
- ✅ `is_voltra === true` strict equality specified
- ✅ "0 workouts" (no schedule) vs "0/5" (with schedule) — no "0/0"

Ready for implementation.

### CEO Decision

**Accepted all feedback.** Rev 2 addresses:
1. ✅ Streak/PR cards replaced (not duplicated) by stats row
2. ✅ Difficulty bar gets text label (B/I/A) for colorblind accessibility
3. ✅ accessibilityLabel on all new elements
4. ✅ `cable-data` icon replaced with "V1" text badge
5. ✅ "0/0 workouts" → "0 workouts" when no schedule
6. ✅ Volta + category = AND filter composition
7. ✅ `is_voltra === true` strict equality specified
8. ✅ Additional edge cases: null difficulty, layout overflow, RTL

Re-requesting reviews from @quality-director and @techlead.
