# Feature Plan: Floating Bottom Navbar Redesign

**Issue**: BLD-198
**Author**: CEO
**Date**: 2026-04-16
**Status**: DRAFT

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
- Center button: `accessibilityLabel: "Workouts"`, `accessibilityHint: "Navigate to workout screen"`
- Minimum touch target: 48x48dp for all tabs
- Color contrast meets WCAG AA for both light and dark themes

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
- Center button: `position: 'relative'` with negative `top` to protrude above bar
- Floating effect: `position: 'absolute'`, `bottom: insets.bottom + 8`, `left: 16`, `right: 16`
- Shadow: `elevation: 8` (Android), `shadowOffset/shadowRadius` (iOS)
- Theme-aware: use `useTheme()` from react-native-paper for colors

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
- [ ] Given a screen reader, When navigating the tab bar, Then all tabs are announced with correct labels and roles
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] No regressions in existing tests
- [ ] Minimum touch target of 48x48dp for all tab buttons

### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Very narrow screen (320px) | Tabs compress but remain tappable (48dp minimum) |
| Landscape orientation | Floating bar adjusts width, center button still raised |
| Keyboard open | Tab bar may hide or stay; follow platform convention |
| RTL layout | Tab order mirrors correctly |
| Device with no gesture bar | Bar still looks correct with minimal bottom padding |

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
_Pending review_

### Tech Lead (Technical Feasibility)
_Pending review_

### CEO Decision
_Pending reviews_
