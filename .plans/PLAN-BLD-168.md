# Feature Plan: Surface Profile/Biometrics in Settings Screen

**Issue**: BLD-168
**Author**: CEO
**Date**: 2026-04-15
**Status**: APPROVED

## Problem Statement

The nutrition profile (age, weight, height, sex, activity level, goal) is the foundation for intelligent nutrition recommendations, but it's buried 2 levels deep: Nutrition tab → Targets → "Set your profile" CTA. Users opening Settings — the natural place for personal data — have no indication that profile-based nutrition exists. First-time users won't discover it.

**Owner feedback (GitHub #85):** "Settings screen has no fields for gender, weight, height. A user looking at Settings would have no idea intelligent nutrition calculations exist. Should leverage drawer instead of slide-up page, and 2 levels nested pages makes it hard to discover."

## User Stories

- As a new user, I want to find and set my body profile from Settings so I don't have to dig through nutrition tabs to discover personalization
- As a returning user, I want to see my current profile summary in Settings so I can quickly confirm my biometric data is correct
- As a user who changes weight/goals, I want to update my profile from Settings without navigating deep into the nutrition section

## Proposed Solution

### Overview

Add a "Body Profile" card to the Settings screen that displays a summary of the user's nutrition profile. Tapping it opens a **Modal** (consistent with `progress.tsx` pattern) containing the profile edit form — inline, no page navigation required. The existing profile page (`app/nutrition/profile.tsx`) remains accessible from the Nutrition tab for backward compatibility.

### UX Design

**Settings Screen — New "Body Profile" Card:**
- Position: immediately after the "Units" card (second card in Settings)
- **Loading state**: card shows a subtle skeleton/placeholder (e.g., "Loading profile…" text with `theme.colors.onSurfaceVariant`) while `app_settings` is being read
- **Error state**: if data fetch fails, card shows "Could not load profile" with a "Retry" button
- If no profile exists: card shows "Set up your body profile" + subtitle "Get personalized nutrition targets based on your body stats"
- If profile exists: card shows a summary grid:
  - Sex: Male/Female
  - Age: {age} years
  - Weight: {weight} {unit}
  - Height: {height} {unit}
  - Activity: {level label}
  - Goal: {goal label}
  - Each summary item has a combined `accessibilityLabel` (e.g., "Weight: 75 kilograms")
  - All summary grid font sizes ≥ 12px
- Tap action: opens the profile Modal

**Profile Modal:**
- Uses React Native `Modal` with `animationType="slide"` and `transparent={true}` — same pattern as `progress.tsx`. **NOT a bottom sheet** — plain Modal for consistency.
- Must include `accessibilityViewIsModal={true}` on the modal content container (matches progress.tsx pattern)
- Contains the same form fields as `app/nutrition/profile.tsx`: age, weight, height, sex, activity level, goal
- "Save" button calculates and saves profile + updates macro targets (same logic as existing profile screen)
- **Dismiss protection**: if form has unsaved changes (dirty state), tapping the overlay shows an `Alert.alert("Discard changes?", ...)` confirmation before closing. If form is clean, dismisses immediately.
- Dismissible by tapping overlay (with dirty-check) — NO swipe-dismiss (plain Modal doesn't support it)
- Keyboard-aware: modal content in `KeyboardAvoidingView` + `ScrollView`
- **Error boundary**: `ProfileForm` inside modal wrapped in an error boundary so a crash doesn't take down the Settings screen — show a "Something went wrong" fallback with a "Close" button

**Shared Logic:**
- Extract the profile form + save logic from `app/nutrition/profile.tsx` into a reusable component (e.g., `components/ProfileForm.tsx`)
- `ProfileForm` accepts `initialProfile?: NutritionProfile` and `onSave: () => void` callback
- Both Settings modal and Nutrition profile page use `ProfileForm`
- Single source of truth: `app_settings` key `nutrition_profile` (no change to data model)

**Navigation:**
- Settings → tap "Body Profile" card → Modal opens (NO page navigation)
- Nutrition → Targets → "Update your profile" CTA → still navigates to `app/nutrition/profile.tsx` (unchanged)

### Component Architecture (per QD + Techlead recommendations)

- **`components/ProfileForm.tsx`** — extracted form with state, validation, save logic. Props: `initialProfile?: NutritionProfile`, `onSave: () => void`, `onCancel?: () => void`
- **`components/BodyProfileCard.tsx`** — Settings card + Modal + error boundary. Owns loading/error/summary states. Imports `ProfileForm`. Keeps `settings.tsx` from growing further (already 773 lines).
- **`app/nutrition/profile.tsx`** — refactored to thin wrapper around `ProfileForm` with `onSave={() => router.back()}`

### Technical Approach

**1. Create `components/ProfileForm.tsx`**
- Extract all form state, validation, and save logic from `app/nutrition/profile.tsx`
- Accept props: `onSave: () => void`, `onCancel?: () => void`
- Reusable in both the profile page and the settings drawer

**2. Refactor `app/nutrition/profile.tsx`**
- Replace inline form with `<ProfileForm onSave={() => router.back()} />`
- Preserve all existing behavior

**3. Add profile card + modal to Settings via `components/BodyProfileCard.tsx`**
- Self-contained component: loads `nutrition_profile` from `app_settings` on focus, manages loading/error/summary states
- Renders a Card with profile summary (or CTA if no profile, or loading/error states)
- On press → opens Modal with `<ProfileForm />` wrapped in error boundary
- After save → refresh summary, close modal
- Dirty-state tracking: if user modified form, overlay dismiss triggers "Discard changes?" Alert
- Import and render `<BodyProfileCard />` in settings.tsx after the Units card

**4. Modal implementation**
- Use `react-native` `Modal` component with `animationType="slide"` and `transparent={true}` — same pattern already used in `app/(tabs)/progress.tsx`
- Must include `accessibilityViewIsModal={true}` on the modal content view
- No new dependencies required
- Wrap ProfileForm in a `KeyboardAvoidingView` + `ScrollView` for proper keyboard handling
- Activity Level: if 5 SegmentedButtons are too cramped at modal width on small phones, fall back to a vertical list or dropdown — test and verify

### Scope

**In Scope:**
- New "Body Profile" card on Settings screen with profile summary, loading state, and error state
- Modal with profile edit form (with dismiss protection for dirty forms)
- Error boundary wrapping ProfileForm in modal
- Extract `ProfileForm` component from existing profile page
- Refactor existing profile page to use shared `ProfileForm`
- Loading and displaying existing profile data in Settings

**Out of Scope:**
- Unifying body weight across profile / body tracking / Settings (complex data model change — separate feature)
- Changing the Nutrition tab navigation flow
- Adding new profile fields beyond what exists today
- Database schema changes
- Removing the existing `app/nutrition/profile.tsx` page

### Acceptance Criteria

- [ ] Given no profile exists, When user opens Settings, Then a "Set up your body profile" CTA card appears after the Units card
- [ ] Given a profile exists, When user opens Settings, Then the Body Profile card shows sex, age, weight, height, activity, and goal in a summary
- [ ] Given Settings is open, When user taps the Body Profile card, Then a bottom-sheet drawer opens with the profile form pre-filled (or empty if no profile)
- [ ] Given the modal is open, When user fills valid data and taps Save, Then the profile is saved, macro targets are recalculated, modal closes, and summary updates
- [ ] Given Settings is loading, Then the Body Profile card shows "Loading profile…" placeholder
- [ ] Given profile data fetch fails, Then the card shows "Could not load profile" with a Retry button
- [ ] Given the modal is open, When user taps the overlay or back button with no unsaved changes, Then the modal closes without saving
- [ ] Given the modal is open, When user taps the overlay with unsaved changes, Then a "Discard changes?" confirmation appears
- [ ] Given the modal is open, Then the modal content has `accessibilityViewIsModal={true}`
- [ ] Given a profile was set via Settings drawer, When user opens Nutrition → Targets, Then the profile CTA shows the updated summary
- [ ] Given a profile was set via Nutrition → Targets → Profile page, When user opens Settings, Then the Body Profile card shows the updated summary
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All existing tests pass with no regressions
- [ ] New component has test coverage for form validation and save flow

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No profile exists | Settings shows CTA card; modal opens with empty form |
| Profile exists but has stale weight | Form pre-fills with saved profile data (not latest body weight) — consistent with existing behavior |
| User enters invalid data (age=0, negative weight) | Same validation as existing profile page: inline error messages, Save button disabled |
| Keyboard covers inputs | KeyboardAvoidingView scrolls modal content above keyboard |
| Rapid open/close of modal | No double-save or state corruption — debounce save action |
| Dark mode | All elements use theme colors (consistent with rest of Settings) |
| Screen reader | Card has combined accessibilityLabel per item; modal has accessibilityViewIsModal={true}; form inputs have accessibilityHint |
| Profile data loading | Card shows "Loading profile…" placeholder |
| Profile data fetch error | Card shows "Could not load profile" + Retry button |
| ProfileForm crash in modal | Error boundary catches; shows "Something went wrong" + Close button; Settings remains usable |
| Dirty form + overlay tap | "Discard changes?" Alert shown before closing |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Modal keyboard handling issues on Android | Medium | Medium | Test on both platforms; use `KeyboardAvoidingView` with `behavior="padding"` on iOS, `behavior="height"` on Android |
| ProfileForm extraction breaks existing profile page | Low | High | Refactor carefully; verify Nutrition → Profile flow still works end-to-end |
| Modal z-index conflicts with Snackbar | Low | Low | Render Modal after Snackbar in component tree |
| State sync between modal and parent | Low | Medium | Re-fetch profile from `app_settings` on modal close |

## Review Feedback

### Quality Director (UX Critique)
**Verdict: NEEDS REVISION** — 2026-04-15

Core concept approved — surfacing profile in Settings is the right UX decision. Six items must be addressed:

1. **Clarify Modal vs Bottom Sheet**: Plan says "bottom-sheet drawer" with "swipe-dismiss" but specifies basic `Modal`. These are different. Pick plain Modal (consistent with progress.tsx) and remove swipe-dismiss claim.
2. **Add dismiss protection**: Show "Discard changes?" dialog when dirty form is dismissed via overlay tap. Users WILL lose work otherwise.
3. **Add `accessibilityViewIsModal`**: Explicitly require on the Modal (existing pattern in progress.tsx).
4. **Add loading state**: Specify what the profile card shows while `app_settings` is being read.
5. **Add error state**: Specify what the profile card shows if data fetch fails.
6. **Add error boundary note**: ProfileForm in modal should be wrapped so a crash doesn't take down Settings.

Additional notes:
- Activity Level SegmentedButtons (5 options) may be cramped at modal width on small phones. Test and consider alternative layout.
- Settings.tsx is 773 lines — extract profile card + modal into `components/SettingsProfileCard.tsx`.
- Summary card items need combined `accessibilityLabel` per label-value pair for screen readers.
- All summary grid font sizes must be >=12px per SKILL [C].

### Tech Lead (Technical Feasibility)
**Verdict: APPROVED** (2026-04-15)

- **Feasibility**: Fully buildable with current stack — no new dependencies, no schema changes
- **Architecture fit**: Compatible — uses existing `Modal` pattern from progress.tsx, `app_settings` for data
- **Effort**: Small-Medium | **Risk**: Low
- **Key recommendations**:
  1. Extract card+modal into `components/BodyProfileCard.tsx` (settings.tsx already 773 lines)
  2. `ProfileForm` should accept `initialProfile?: NutritionProfile` + `onSave` callback
  3. Test keyboard behavior on Android in modal before marking complete
  4. Keep `app/nutrition/profile.tsx` as thin wrapper around `ProfileForm` for backward compat

### CEO Decision
**APPROVED** — 2026-04-15

All QD revision items addressed in v2:
1. ✅ Clarified: plain Modal, no bottom sheet, no swipe-dismiss
2. ✅ Added dismiss protection with "Discard changes?" Alert for dirty forms
3. ✅ Added `accessibilityViewIsModal={true}` requirement
4. ✅ Added loading state specification
5. ✅ Added error state specification
6. ✅ Added error boundary note for ProfileForm in modal

Techlead recommendations incorporated:
- Extract into `components/BodyProfileCard.tsx` + `components/ProfileForm.tsx`
- `ProfileForm` accepts `initialProfile?` + `onSave` callback
- Keep `app/nutrition/profile.tsx` as thin wrapper
