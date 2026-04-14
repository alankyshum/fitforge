# Feature Plan: User Flow Integration Tests (Phase 28)

**Issue**: BLD-71
**Author**: CEO
**Date**: 2026-04-14
**Status**: DRAFT

## Problem Statement

FitForge has 218 unit tests but ZERO integration tests for user flows. The board explicitly requested: "build a more robust infra for automated end to end user-behavior like test. Mimic real world user flow asserting all common user interactions on complex steps are working." The two most complex screens — Active Session (1154 lines) and Workouts Home (1073 lines) — have no render tests at all. Only 1 app-level test exists (nested button fix). This creates risk: regressions in core user journeys go undetected until users report them.

## User Stories

- As a developer, I want integration tests that exercise complete user flows so that regressions in core journeys are caught before release
- As a developer, I want tests that run fast in CI (no emulator/simulator) so that the feedback loop stays tight
- As a quality director, I want measurable test coverage of critical user paths so that QA verification is augmented by automation

## Proposed Solution

### Overview

Add integration tests using `@testing-library/react-native` (already installed) that render real screens, simulate user interactions (press, type, scroll), and assert observable outcomes. Tests use a real in-memory SQLite database (via `expo-sqlite` mock) seeded with fixture data — no duplicating business logic in mocks.

### Test Architecture

**Framework**: Jest + @testing-library/react-native (already installed)
**Directory**: `__tests__/flows/` (new — separate from unit tests)
**Naming**: `<screen-name>.flow.test.tsx`

**Key design decisions:**
1. **Real database queries via thin mock** — Mock `expo-sqlite` to use an in-memory SQLite instance (via `better-sqlite3` or `sql.js`). All `lib/db.ts` functions run real SQL against real schema. No hand-written return values.
2. **Render real screens** — Import and render actual screen components. Use `@testing-library/react-native` `render()`, `fireEvent`, `waitFor`.
3. **Navigation mock** — Mock `expo-router` navigation hooks (`useRouter`, `useLocalSearchParams`) to control which screen renders and capture navigation calls.
4. **Minimal component mocks** — Only mock native modules that crash in JSDOM (Haptics, KeepAwake, Linking). Never mock business logic.

### Scope

**In Scope — 5 Critical User Flows:**

1. **Workout Session Flow** (`app/session/[id].tsx`)
   - Start session from template -> add sets -> complete sets -> finish session
   - Rest timer triggers after set completion
   - RPE selection on sets
   - Cancel session with confirmation

2. **Workouts Home Flow** (`app/(tabs)/index.tsx`)
   - View upcoming workouts / recent sessions
   - Start new session from template
   - Navigate to history
   - Empty state (no sessions yet)

3. **Exercise Management Flow** (`app/(tabs)/exercises.tsx` + `app/exercise/`)
   - Browse exercise library -> view exercise detail
   - Create custom exercise -> verify it appears in list
   - Edit exercise -> verify changes persist

4. **Nutrition Tracking Flow** (`app/(tabs)/nutrition.tsx` + `app/nutrition/`)
   - Add food entry -> see daily totals update
   - Set macro targets -> see progress bar reflect targets
   - Switch between dates

5. **Settings and Data Flow** (`app/(tabs)/settings.tsx`)
   - Export data -> verify file generation
   - Toggle unit system -> verify all displays update

**Out of Scope:**
- True E2E tests requiring emulator/simulator (Detox, Maestro)
- Visual regression testing (screenshot comparison)
- Performance testing
- Network/API testing (app is offline-first)
- Testing third-party library internals (charting, etc.)
- Onboarding flow (already tested via unit tests)

### Test Fixtures and Helpers

Create `__tests__/flows/helpers/`:
- `setup-db.ts` — Initialize in-memory SQLite, run migrations, seed fixture data
- `render-screen.ts` — Wrapper that provides theme, navigation context
- `fixtures.ts` — Standard test data: exercises, templates, sessions, food entries
- `mocks/` — Minimal mocks for native modules (Haptics, KeepAwake, etc.)

### Fixture Data

Seed with realistic data covering key scenarios:
- 3 exercises (Bench Press, Squat, Deadlift) with different equipment types
- 1 workout template with the 3 exercises
- 2 completed sessions (yesterday, 3 days ago) with sets
- 1 in-progress session
- Food entries for today with varying macro profiles
- Macro targets set
- Body weight entries (3 data points over a week)

### Acceptance Criteria

- [ ] `__tests__/flows/` directory exists with 5 flow test files
- [ ] All 5 user flows have at least 3 test cases each (minimum 15 new tests)
- [ ] Tests use real database queries (no hand-mocked return values for db functions)
- [ ] Tests render actual screen components (not simplified test doubles)
- [ ] `npm test` runs all flow tests alongside existing unit tests
- [ ] All 218 existing tests continue to pass
- [ ] No new dev dependencies added beyond what is already in package.json (prefer existing tools)
- [ ] Test helper utilities are reusable across future flow tests
- [ ] Tests complete in under 10 seconds total (CI-friendly)
- [ ] TypeScript typecheck passes (`npx tsc --noEmit`)

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty database (no sessions/exercises) | Flow tests verify empty state renders correctly |
| Session with 0 completed sets | Finish session shows appropriate state |
| Nutrition with no targets set | Progress bars show defaults or "set targets" CTA |
| Exercise with deleted template reference | Graceful display without crash |
| Large data set (50+ sets in session) | FlatList renders without performance issues |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| expo-sqlite mock doesn't perfectly replicate real behavior | Medium | Medium | Use sql.js (WebAssembly SQLite) for high-fidelity mock; fallback to jest manual mock if needed |
| Screen components have implicit dependencies not easily mockable | Medium | Low | Document unmockable deps; skip those specific interactions in flow tests |
| Tests become slow with real DB operations | Low | Low | Use in-memory DB; reset between tests not between assertions |
| React Native Paper components need special rendering | Low | Low | Already have react-test-renderer installed; RNTL handles Paper components |

## Implementation Notes

**Approach for expo-sqlite mock:**
The most practical approach is a jest manual mock at `__mocks__/expo-sqlite.ts` that wraps `better-sqlite3` (Node.js native SQLite). This gives us:
- Real SQL execution
- Real schema enforcement
- Same query results as production
- Fast in-memory performance

If `better-sqlite3` is impractical (native compilation), fall back to a lighter mock that intercepts `db.execSync()` / `db.getFirstSync()` calls with pre-seeded data structures. This is less faithful but still exercises the render + interaction layer.

**The engineer should choose the approach that works in our CI environment** and document the tradeoffs.

## Review Feedback
<!-- This section is filled in by reviewers -->

### Quality Director (UX Critique)
_Pending review_

### Tech Lead (Technical Feasibility)
_Pending review_

### CEO Decision
_Pending reviews_
