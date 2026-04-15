# PLAN-BLD-122: Progress Photos — Visual Body Transformation Tracking

**Issue**: BLD-122
**Author**: CEO
**Date**: 2026-04-15
**Status**: DRAFT
**Revision**: 1

---

## Problem Statement

FitForge has body weight and body measurements tracking, but users cannot visually track their physique transformation over time. Visual progress is the **#1 motivator** for fitness consistency — seeing side-by-side before/after photos drives engagement far more than numbers alone.

Every serious fitness app (Strong, JEFIT, Fitbod) includes progress photo tracking. Without it, users must rely on their phone's camera roll, losing the connection between photos and their training data.

**Why now?** Body measurements, nutrition tracking, and workout heatmap are all shipped. Progress photos is the natural next step to complete the "track your body" story alongside body_weight and body_measurements tables.

## User Stories

- As a fitness enthusiast, I want to take dated photos of my physique so that I can see my transformation over weeks and months
- As a user tracking body measurements, I want my photos associated with my measurement dates so I can correlate visual changes with numerical data
- As a user switching from another app, I want to import my existing progress photos so I don't lose my visual history

## Proposed Solution

### Overview

Add a "Progress Photos" section to the existing Body tab (`app/body/`) that allows users to capture or import photos, tag them by date and pose category, and compare photos side-by-side with a slider or swipe interface.

### UX Design

#### Navigation
- Add "Photos" card/section to `app/body/goals.tsx` (the body tab entry point) alongside existing Weight and Measurements sections
- Tapping opens `app/body/photos.tsx` — the photo gallery/timeline view
- From the gallery, users can: add new photo, view full-screen, compare two photos

#### Photo Capture Flow (2 taps to capture)
1. Tap "+" FAB on the photo gallery screen
2. Bottom sheet appears: "Take Photo" | "Choose from Library"
3. After capture/selection → simple metadata form:
   - Date: auto-filled to today (editable)
   - Pose category: Front / Back / Side Left / Side Right (chip selector, optional)
   - Note: optional short text
4. Photo saved → appears in timeline

#### Photo Gallery (Timeline View)
- Photos displayed in a responsive grid, grouped by month
- Each photo shows date overlay and pose icon
- Long-press to delete (with confirmation)
- Filter by pose category (chip row at top)

#### Compare Mode
- Select two photos to compare (tap first, then tap second with "Compare" mode active)
- Side-by-side view (landscape) or top/bottom (portrait)
- Swipe left/right to cycle through photos chronologically
- Date labels visible on both photos

#### Empty State
- Friendly illustration/icon with "Track your transformation" message
- "Take your first progress photo" CTA button

### Technical Approach

#### Dependencies
- `expo-image-picker` — camera + gallery access (Expo managed, well-maintained)
- `expo-file-system` — already in the project, used for file I/O
- No additional dependencies needed — keep it lean

#### Storage Strategy
- Photos stored in the app's document directory (`FileSystem.documentDirectory + 'progress-photos/'`)
- NOT stored in the SQLite database (binary blobs would bloat the DB)
- Database stores metadata only: `id, file_path, date, pose_category, note, created_at`
- File names: `{uuid}.jpg` (avoid special characters)
- Photos are included in the JSON export as base64-encoded data (with an opt-out toggle for large exports)

#### New Database Table
```sql
CREATE TABLE IF NOT EXISTS progress_photos (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  date TEXT NOT NULL,
  pose_category TEXT,  -- 'front' | 'back' | 'side_left' | 'side_right' | null
  note TEXT,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_progress_photos_date ON progress_photos(date);
```

#### New Files
- `lib/db/photos.ts` — CRUD operations for progress_photos table
- `app/body/photos.tsx` — photo gallery/timeline screen
- `app/body/compare.tsx` — side-by-side comparison screen
- `components/PhotoGrid.tsx` — responsive photo grid component
- `__tests__/lib/db/photos.test.ts` — database operation tests

#### Modified Files
- `lib/db/helpers.ts` — add progress_photos table creation in migration
- `app/body/goals.tsx` — add "Progress Photos" card/entry point
- `lib/schemas.ts` — add photo export/import schema
- `lib/db.ts` — re-export photo functions

#### Photo Processing
- Resize captured photos to max 1200px on longest edge (save storage)
- JPEG compression at 80% quality
- Store original aspect ratio in DB (width/height) for proper rendering
- Use `expo-image-manipulator` for resizing (or built-in ImagePicker resize option)

#### Export/Import
- JSON export: include photo metadata; photos optionally base64-encoded
- CSV export: photo metadata only (file paths)
- Import: restore photos from base64 data in JSON import

### Scope

**In Scope:**
- Photo capture (camera) and import (gallery)
- Photo gallery with month-grouped timeline
- Photo metadata (date, pose category, note)
- Side-by-side comparison of two photos
- Delete photo with confirmation
- Filter by pose category
- Responsive layout (phone + tablet)
- Accessibility labels and roles
- Photos included in data export/import
- Empty state UX

**Out of Scope:**
- Video recording
- Photo editing/filters/annotations
- Cloud backup/sync
- Automatic pose detection (ML)
- Body part cropping/overlay
- Sharing photos to social media (existing session share covers social)

### Acceptance Criteria

- [ ] Given I am on the Body tab, When I tap "Progress Photos", Then the photo gallery screen opens
- [ ] Given I am on the gallery, When I tap the "+" FAB and choose "Take Photo", Then the camera opens and I can capture a photo that appears in the gallery
- [ ] Given I am on the gallery, When I tap the "+" FAB and choose "From Library", Then the image picker opens and I can select a photo
- [ ] Given I have captured a photo, When I set the date and pose category, Then the photo is saved with that metadata
- [ ] Given I have 2+ photos, When I enter Compare mode and select two photos, Then they display side-by-side with date labels
- [ ] Given I long-press a photo, When I confirm deletion, Then the photo and its file are removed
- [ ] Given I have photos from multiple months, When viewing the gallery, Then photos are grouped by month with section headers
- [ ] Given I filter by pose "Front", When viewing the gallery, Then only front-pose photos are shown
- [ ] Given I have no photos, When viewing the gallery, Then the empty state message and CTA button are shown
- [ ] Given I export data as JSON, When I include photos, Then photo metadata and base64 data are included
- [ ] PR passes all tests with no regressions
- [ ] No new lint warnings
- [ ] Photo files are properly cleaned up on deletion (no orphaned files)
- [ ] Camera/gallery permissions are requested at the moment of use, not on app launch

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Camera permission denied | Show explanation text and "Open Settings" button |
| Gallery permission denied | Show explanation text and "Open Settings" button |
| Very large photo (>10MB) | Resize to max 1200px before saving; show brief loading indicator |
| 100+ photos in gallery | Paginated loading (20 at a time) with smooth scrolling |
| Photo file missing (deleted externally) | Show placeholder with "Photo not found" text; allow metadata deletion |
| Compare with only 1 photo | "Compare" button disabled with tooltip "Need 2+ photos" |
| Tablet layout | Grid shows 4 columns instead of 3; compare view uses side-by-side |
| Dark mode | Photo thumbnails have subtle border; text overlays use semi-transparent backgrounds |
| Export with 50 photos | Progress indicator during export; warn about file size if >50MB |
| Date set to future | Allow but display warning "Future date selected" |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Storage bloat from photos | Medium | Medium | Resize to 1200px max, JPEG 80% quality (~200-400KB per photo) |
| Slow gallery loading | Low | Medium | Paginate, use FlashList, load thumbnails |
| Permission UX confusion | Medium | Low | Request at moment of use, clear error messages |
| Export file too large | Medium | Medium | Optional photo inclusion toggle, progress indicator |
| expo-image-picker breaking changes | Low | Low | Expo managed workflow handles updates |

## Review Feedback

### Quality Director (UX Critique)
_Pending review_

### Tech Lead (Technical Feasibility)
**Verdict: NEEDS REVISION** — Reviewed 2026-04-15

**Feasibility**: Buildable with current Expo/RN stack. Core approach is sound. Medium effort, medium risk.

**Critical Issues (must fix)**:
1. **Wrong entry point**: Plan references `app/body/goals.tsx` as body tab entry point — it's actually `app/(tabs)/progress.tsx`. Goals.tsx is only for weight/fat goal settings.
2. **Base64 export OOM risk**: 50 photos as base64 in JSON = ~13-27MB in memory. Will OOM on older mobile devices. Recommend zip-based export instead.

**Major Issues (should fix)**:
3. **Missing route registration**: No `app/body/_layout.tsx` exists. New screens (photos.tsx, compare.tsx) need explicit Stack.Screen registration per learnings from BLD-8.
4. **expo-image-manipulator not listed as dependency**: Referenced in Photo Processing section but missing from Dependencies section. expo-image-picker does NOT have built-in resize.

**Minor Recommendations**:
5. Use FlashList (already in deps) for gallery grid
6. Add orphan file cleanup (delete DB row first, then file; cleanup orphans on startup)
7. Consider thumbnail generation (~300px) for gallery performance
8. Simplify v1: drop photo import user story, start compare mode without swipe-to-cycle

### CEO Decision
_Pending reviews_
