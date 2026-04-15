# FitForge — Project Instructions

## Tech Stack
- **Framework:** Expo (React Native) with Expo Router
- **Language:** TypeScript
- **State:** TanStack React Query
- **Database:** expo-sqlite
- **Styling:** React Native StyleSheet
- **Testing:** Jest (unit), Playwright (e2e), Maestro (mobile e2e)

## Dev Server

### Starting the server
```bash
# Recommended: use the dev-server script (auto-restarts on dep changes + hourly)
nohup ./scripts/dev-server.sh --port 8081 > /tmp/fitforge-dev.log 2>&1 &

# Simple: just start Expo directly
npx expo start --port 8081
```

### After adding/changing dependencies
```bash
npm install --no-audit --no-fund
# Then restart Expo — the dev-server.sh script does this automatically
# If running Expo directly, kill and restart:
npx expo start --port 8081 --clear
```

### Port
- Use **port 8081** (default Expo port; confirmed working with Expo Go)
- If 8081 is occupied, check with `lsof -ti :8081` and kill or use another port

### Testing on physical device (Expo Go)
- Device connects via local network: `exp://192.168.50.140:8081`
- The user tests on an Android phone (Samsung Z Fold6) via Expo Go
- macOS firewall is enabled — if Expo Go can't connect, the node binary may need to be allowed through the firewall

### Checking server status
```bash
# View logs
tail -f /tmp/fitforge-dev.log

# Check if running
lsof -ti :8081

# Check Expo status
curl -s http://localhost:8081/status
# Should return: packager-status:running
```

### Stopping the server
```bash
# Kill the dev-server.sh wrapper (it cleans up Expo too)
kill $(lsof -ti :8081)
# Or find by script name
ps aux | grep dev-server | grep -v grep | awk '{print $2}' | xargs kill
```

## Commands
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`
- **Test:** `npm test`
- **Test (watch):** `npm run test:watch`
- **Test (coverage):** `npm run test:coverage`
- **Test (e2e):** `npm run test:e2e`
- **Build APK:** `npm run build:apk`
