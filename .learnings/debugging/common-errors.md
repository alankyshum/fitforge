# Common Errors

## Learnings

### Expo Kotlin NoSuchMethodError on Newer Android = SDK Version Too Old
**Source**: BLD-179 — Android crash on launch (NativeDatabase.constructor SharedRef error)
**Date**: 2026-04-16
**Context**: The app crashed immediately on launch on Android 16 (OS 36) with `NoSuchMethodError: No direct method <init>` in `expo.modules.kotlin.sharedobjects.SharedRef`. The APK was built with Expo SDK 54; the user's device ran Android 16 which shipped after SDK 54's release.
**Learning**: `java.lang.NoSuchMethodError` in `expo.modules.kotlin.*` classes on a newer Android version is a reliable signal that the Expo SDK's Kotlin native modules are binary-incompatible with the target OS. Each Android OS release may change ABI expectations for constructor signatures. Upgrading to the latest Expo SDK (which targets the newer OS) resolves it. This is distinct from JS-level errors — it is a native binary crash that no JS fix can address.
**Action**: When users report native Kotlin/Java crashes (`NoSuchMethodError`, `NoSuchFieldError`, `AbstractMethodError`) in `expo.modules.*` on a newer Android version, check which Expo SDK the APK was built with. If the SDK predates the Android version, upgrade the SDK. Do not attempt JS-level fixes — the crash is in compiled native code.
**Tags**: expo, android, kotlin, nosuchmethoderror, native-crash, sdk-upgrade, sharedref, binary-compatibility

### Async Singleton Initialization Requires a Promise Mutex
**Source**: BLD-3 — Workout detail crash (NativeDatabase.prepareAsync NullPointerException)
**Date**: 2026-04-13
**Context**: `getDatabase()` in `lib/db.ts` used `if (!db) { db = await open(); }` — a naive async singleton. Multiple components calling `getDatabase()` concurrently during app startup each entered the init path before `db` was assigned, causing parallel `openDatabaseAsync` + `migrate` calls that corrupted state.
**Learning**: The `await` gap between checking `if (!db)` and assigning `db = ...` lets concurrent callers all pass the null check and each start their own initialization. On Android, this manifests as `NativeDatabase.prepareAsync NullPointerException` — a misleading native error that obscures the JS-level race condition.
**Action**: For any async singleton (database, auth, config), store the pending init promise and return it to concurrent callers: `if (!initPromise) { initPromise = doInit(); } return initPromise;`. Reset the promise on failure to allow retry.
**Tags**: async, singleton, race-condition, expo-sqlite, android, promise-mutex, database-init
