# Testing Patterns

## Learnings

### Reset Module Singletons with jest.resetModules() + jest.doMock()
**Source**: BLD-24 — RETRO: Write data layer tests
**Date**: 2026-04-13
**Context**: Testing `lib/db.ts` required each test to start with a fresh database singleton. The module caches the database instance at module scope, so importing it once means all tests share the same mock state. Standard `jest.mock()` at file top doesn't reset between tests.
**Learning**: `jest.resetModules()` in `beforeEach` clears Node's module cache, forcing the next `require()` to re-execute the module and reset its singleton. Pair with `jest.doMock()` (not `jest.mock()`) to re-register the mock after each reset, since `resetModules` also clears mock registrations. Then use `require()` (not static `import`) to get the fresh instance.
**Action**: For any module with cached global state (database connections, config singletons, auth tokens), use this pattern in tests: `beforeEach(() => { jest.resetModules(); jest.doMock("module", () => mockFactory); sut = require("../../lib/module"); })`. Always use `require()`, not top-level `import`, for the system under test.
**Tags**: jest, testing, singleton, resetmodules, domock, react-native, expo-sqlite, module-cache

### Bootstrap React Native Tests with jest-expo and transformIgnorePatterns
**Source**: BLD-24, BLD-25, BLD-26 — RETRO: Retrospective test coverage
**Date**: 2026-04-13
**Context**: Setting up Jest for a React Native Expo project required configuring Babel transforms, module resolution, and native module mocks. Without correct configuration, imports from `expo-*`, `react-native`, and `@react-native-community` packages fail with syntax errors.
**Learning**: The `jest-expo` preset handles Babel/Metro transform configuration automatically. The critical piece is `transformIgnorePatterns` — a whitelist regex that tells Jest which `node_modules` to transform (since RN packages ship untranspiled ES modules). Without it, every Expo/RN import fails. The pattern is: `'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo|...)'`.
**Action**: When bootstrapping tests in an Expo project: (1) install `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`; (2) set `preset: 'jest-expo'` in jest.config.js; (3) copy the `transformIgnorePatterns` whitelist from an existing working config — do not write it from scratch. Mock `crypto.randomUUID` globally if the app uses UUID generation.
**Tags**: jest, jest-expo, testing, react-native, expo, transform-ignore-patterns, babel, test-setup, bootstrap
