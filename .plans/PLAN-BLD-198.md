# Feature Plan: Floating Bottom Navbar Redesign

**Issue**: BLD-198
**Author**: CEO
**Date**: 2026-04-16
**Status**: IN_REVIEW (Rev 3 — addressing Quality Director feedback)

## Problem Statement
Two issues with the current bottom navbar:
1. **Android gesture bar collision** — The tab bar's `paddingBottom: 8` is insufficient on Android devices with gesture navigation, causing the tab bar to overlap with the system gesture bar.
2. **No visual hierarchy** — All 5 tabs look identical. The owner wants the primary action (Workouts) to stand out with a distinct floating bar design.

The owner specifically requested: floating bar design, enlarged circular middle button for Workout (the index/primary tab), research good navbar designs.

## User Stories
- As a user, I want the bottom navbar to not collide with Android's gesture navigation bar so that I can tap tabs without accidentally triggering system gestures.
- As a user, I want the primary action (Start Workout) to be visually prominent so I can quickly access the most-used feature.
- As a user, I want a polished, modern navigation bar that feels premium.

## Proposed Solution

### Overview
Replace the default Expo Router `Tabs` tab bar with a custom `FloatingTabBar` component that:
- Floats above the bottom edge with rounded corners and a subtle shadow/elevation
- Has a raised, circular center button for the Workouts tab
- Respects safe area insets (handles Android gesture bar and iPhone home indicator)
- Maintains the existing 5-tab structure

### UX Design

**Layout (left to right):**
| Exercises | Nutrition | 🏋️ Workouts (raised) | Progress | Settings |

- **Floating bar**: Rounded container (`borderRadius: 24`) with `margin: 16` from edges, elevated with shadow
- **Center button**: Workouts tab rendered as a circular raised button (~56dp diameter) that protrudes above the bar by ~12dp
- **Other tabs**: Standard icon + label below, evenly spaced
- **Safe area**: Bar sits above the safe area bottom inset, with transparent space below for the gesture bar
- **Active state**: Primary color fill on active icon, subtle color on inactive

**Interaction:**
- Tapping any tab navigates as before (Expo Router handles this)
- The center button has a slight scale animation on press
- No haptic feedback changes needed

**Accessibility:**
- All tabs maintain `accessibilityRole: "tab"` and `accessibilityLabel`
- All tabs include `accessibilityState: { selected: route.key === state.routes[state.index].key }` so screen readers announce "selected" state
- Center button: `accessibilityLabel: "Workouts"`, `accessibilityHint: "Navigate to workout screen"`
- Minimum touch target: 48x48dp for all tabs, 56dp for center button (full circle tappable including 12dp protrusion — use `hitSlop` or expanded wrapper)
- Color contrast meets WCAG AA for both light and dark themes
- Screen reader tab order matches visual order (left-to-right, mirrored in RTL)

**Reduced Motion:**
- Center button scale animation respects `useReducedMotion()` from `react-native-reanimated`
- When reduced motion is enabled: replace scale animation with instant opacity change (0.7 → 1.0) on press — no spring/timing animations
- All other tabs already use no animation (simple highlight), so no changes needed

**Keyboard Behavior:**
- The floating tab bar HIDES when the software keyboard is open
- Implementation: Listen to `Keyboard.addListener('keyboardDidShow')` / `keyboardDidHide` events from `react-native` and animate the bar out (translateY off-screen) on show, back on hide
- This prevents the floating bar from occluding text inputs (exercise search, macro entry, etc.)
- Must work on both iOS and Android

### Technical Approach

**Architecture:**
1. Create `components/FloatingTabBar.tsx` — custom tab bar component
2. Modify `app/(tabs)/_layout.tsx` — pass custom tab bar via `tabBar` prop
3. Use `react-native-safe-area-context` (already installed) for bottom inset
4. Use `react-native-reanimated` (already installed) for center button press animation

**Implementation details:**
- Expo Router's `<Tabs>` accepts a `tabBar` prop for custom tab bar rendering
- Custom tab bar receives `state`, `descriptors`, `navigation` props from React Navigation
- Use `useSafeAreaInsets()` to get bottom padding for Android gesture bar
- Center button: Wrap in a `View` spanning full height (bar + protrusion) to ensure Android touch targets work — do NOT rely on `overflow: 'visible'` which doesn't propagate touches on Android
- Floating effect: `position: 'absolute'`, `bottom: insets.bottom + 8`, `left: 16`, `right: 16`
- **Background**: Opaque `theme.colors.surface` background with `borderRadius: 24`. Content scrolling behind the bar in the gap between bar edges and screen edges is acceptable since the bar itself is opaque. The area below the bar (safe area zone) inherits the screen's background color.

**Content Bottom Padding Strategy (CRITICAL):**
- Export `FLOATING_TAB_BAR_HEIGHT` constant from `FloatingTabBar.tsx` = bar height (56dp) + bottom margin (8dp) + buffer (8dp) = 72dp base
- Provide `useFloatingTabBarHeight()` hook that returns `FLOATING_TAB_BAR_HEIGHT + insets.bottom` (accounts for safe area dynamically)
- React Navigation's `useBottomTabBarHeight()` will NOT work with absolute positioning — use our custom hook instead
- **All tab screens MUST use `useFloatingTabBarHeight()` for `contentContainerStyle.paddingBottom`** — update every scrollable container in same PR
- Screens to update: `app/(tabs)/index.tsx`, `app/(tabs)/exercises.tsx`, `app/(tabs)/nutrition.tsx`, `app/(tabs)/progress.tsx`, `app/(tabs)/settings.tsx`
- This is done in the same PR as the tab bar component — not a follow-up
- Shadow: Apply `elevation` independently to bar container and center button (Android elevation clips to parent bounds, so protruding center button needs its own elevation)
- Theme-aware: use `useTheme()` from react-native-paper for colors

**IMPORTANT: `index.tsx` must NOT be renamed.** Reordering tabs by reordering `<Tabs.Screen>` definitions is correct, but `app/(tabs)/index.tsx` (Workouts) is the Expo Router default route. The file stays as `index.tsx` — only its visual position changes to center.

**Tab order change:**
Current: Workouts | Exercises | Nutrition | Progress | Settings
New: Exercises | Nutrition | **Workouts** (center) | Progress | Settings

This requires reordering the `<Tabs.Screen>` definitions in `_layout.tsx`.

**No new dependencies.** All required packages are already installed.

### Scope
**In Scope:**
- Custom FloatingTabBar component
- Raised circular center button for Workouts
- Safe area inset handling (Android gesture bar + iPhone home indicator)
- Dark/light theme support
- Tab reordering (Workouts to center position)
- Smooth press animation on center button

**Out of Scope:**
- Changing tab icons or labels
- Adding/removing tabs
- Tab badges or notification indicators
- Swipe gestures between tabs
- Bottom sheet integration with tab bar

### Acceptance Criteria
- [ ] Given Android with gesture navigation, When viewing any tab, Then the navbar does not overlap with the gesture bar
- [ ] Given any screen, When viewing the navbar, Then it appears as a floating bar with rounded corners and elevation/shadow
- [ ] Given the navbar, When looking at the center position, Then the Workouts tab appears as a raised circular button
- [ ] Given dark mode, When viewing the navbar, Then colors correctly follow the dark theme
- [ ] Given light mode, When viewing the navbar, Then colors correctly follow the light theme
- [ ] Given any tab, When tapping it, Then navigation works correctly (same as before)
- [ ] Given the Workouts center button, When pressing it, Then a subtle scale animation plays
- [ ] Given OS "Reduce Motion" is enabled, When pressing the center button, Then no scale animation plays (opacity change instead)
- [ ] Given a screen reader, When navigating the tab bar, Then all tabs are announced with correct labels, roles, and selected state
- [ ] Given `accessibilityState`, When a tab is active, Then screen readers announce "selected" state
- [ ] Given a text input is focused (e.g., exercise search), When the keyboard opens, Then the floating tab bar hides
- [ ] Given any tab screen with scrollable content, When the floating bar is visible, Then no content is hidden behind the bar (paddingBottom accounts for bar height via `useFloatingTabBarHeight()`)
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] `FLOATING_TAB_BAR_HEIGHT` constant exported and used by all tab screens for bottom padding
- [ ] No content hidden behind the floating bar on any screen
- [ ] No regressions in existing tests
- [ ] Minimum touch target of 48x48dp for all tab buttons

### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Very narrow screen (320px) | Tabs compress but remain tappable (48dp min). If width < 320px, remove tab labels and use icon-only mode |
| Landscape orientation | Floating bar adjusts width, center button still raised |
| Keyboard open | Floating tab bar hides via Keyboard API listener; animates back when keyboard dismisses |
| RTL layout | Tab order mirrors correctly |
| Device with no gesture bar | Bar still looks correct with minimal bottom padding |
| Android 3-button nav | Different inset values; bar adjusts correctly |
| iPhone SE (small screen) | Bar fits, tabs compressed but minimum 48dp touch targets |
| iPad (large screen) | Bar width adapts, maintains proportions |

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Custom tab bar breaks Expo Router navigation | Low | High | Use documented `tabBar` prop API, test all tab transitions |
| Center button overlaps content above | Medium | Medium | Use absolute positioning and ensure content has enough bottom padding |
| Animation performance on low-end Android | Low | Medium | Use Reanimated (native thread), keep animations simple |
| Dark/light theme inconsistency | Low | Low | Use theme.colors throughout, test both modes |

## Review Feedback
<!-- This section is filled in by reviewers -->

### Quality Director (UX Critique)
**Verdict**: NEEDS REVISION (4 blocking, 3 major)
- [x] Content bottom padding strategy → Added explicit `useFloatingTabBarHeight()` hook + all screens listed for update
- [x] `accessibilityState: { selected }` → Added to Accessibility section + acceptance criteria
- [x] `useReducedMotion()` → Added Reduced Motion section + acceptance criteria
- [x] Keyboard behavior → Added Keyboard Behavior section + acceptance criteria
- [x] Floating bar background treatment (major) → Specified opaque `theme.colors.surface`
- [x] Hit area for protruding center button (major) → Already addressed in Rev 2 (wrapper View)
- [x] Narrow screen <320px fallback (major) → Added icon-only mode fallback

### Tech Lead (Technical Feasibility)
**Verdict**: NEEDS REVISION

**Technical Feasibility**: Confirmed feasible. Expo Router's `<Tabs>` wraps React Navigation's `createBottomTabNavigator().Navigator` via `withLayoutContext` and spreads all props (`{...props}`), so the `tabBar` prop is fully supported. Dependencies (`react-native-reanimated` 4.2.1, `react-native-safe-area-context` ~5.6.0) already installed. No new deps.

**Architecture Fit**: Compatible. Custom `tabBar` prop is the documented React Navigation pattern. Single new file `FloatingTabBar.tsx` + minor `_layout.tsx` changes — clean, minimal footprint.

**Complexity**: Medium effort, Medium risk.

**Issues Found (must fix before approval)**:

1. **CRITICAL — Content Bottom Padding Gap**: The plan proposes `position: 'absolute'` for the floating bar but does NOT address how screens account for tab bar height. With absolute positioning, React Navigation will NOT reserve space — every screen's scroll content will be hidden behind the bar. Current `paddingBottom` values are already inconsistent (0, 8, 32, 48, 80 across screens). **Fix**: Export a `FLOATING_TAB_BAR_HEIGHT` constant from `FloatingTabBar.tsx` (bar height + margin + inset buffer). Each tab screen must use this. Alternatively, provide a `useTabBarHeight()` hook. React Navigation's `useBottomTabBarHeight()` won't work with absolute positioning.

2. **MAJOR — Android Touch Target for Center Button**: The center button protrudes above the bar by ~12dp with negative `top`. On Android, `overflow: 'visible'` does NOT allow touches outside the parent's bounds. The protruding part may be untappable. **Fix**: Use a wrapper `View` that spans the full height (bar + protrusion) rather than relying on overflow. Or use `hitSlop`.

3. **MAJOR — index.tsx Must Not Be Renamed**: Moving Workouts from position 1 to 3 (center) by reordering `<Tabs.Screen>` is correct. But `index.tsx` is the Expo Router default route — it must NOT be renamed. Plan should explicitly call this out.

4. **MINOR — Shadow/Elevation**: Android `elevation` clips to view bounds. Since center button protrudes, parent container's elevation won't wrap it. Apply elevation to bar and center button independently.

**Recommendations**:
- Export `FLOATING_TAB_BAR_HEIGHT` and update all tab screen `paddingBottom` in same PR
- Test on Android gesture nav AND 3-button nav (different inset values)
- Test on iPhone SE (small screen) and iPad (large screen)
- Simple Reanimated scale animation is fine — no performance concerns

### CEO Decision
Rev 2 addresses all Tech Lead findings:
- CRITICAL: Added `FLOATING_TAB_BAR_HEIGHT` constant + `useFloatingTabBarHeight()` hook; all screens must use it
- MAJOR (touch): Center button uses wrapper View spanning full height instead of overflow
- MAJOR (index.tsx): Explicit callout that index.tsx must not be renamed
- MINOR (shadow): Independent elevation for bar and center button

Rev 2 sent to Quality Director. Rev 3 addresses all 4 QD blocking issues and 3 major recommendations.
Resubmitting for QD re-review.
