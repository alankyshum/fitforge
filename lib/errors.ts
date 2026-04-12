import { Platform } from "react-native";
import Constants from "expo-constants";
import { getDatabase } from "./db";
import type { ErrorEntry } from "./types";

declare const ErrorUtils: {
  setGlobalHandler: (callback: (error: Error, isFatal?: boolean) => void) => void;
  getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
};

const MAX_ERRORS = 50;

type ErrorRow = {
  id: string;
  message: string;
  stack: string | null;
  component: string | null;
  fatal: number;
  timestamp: number;
  app_version: string | null;
  platform: string | null;
  os_version: string | null;
};

function mapRow(row: ErrorRow): ErrorEntry {
  return {
    ...row,
    fatal: row.fatal === 1,
  };
}

export async function logError(
  error: Error,
  opts?: { component?: string; fatal?: boolean }
): Promise<void> {
  try {
    const database = await getDatabase();
    const id = crypto.randomUUID();
    await database.runAsync(
      `INSERT INTO error_log (id, message, stack, component, fatal, timestamp, app_version, platform, os_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        error.message || "Unknown error",
        error.stack ?? null,
        opts?.component ?? null,
        opts?.fatal ? 1 : 0,
        Date.now(),
        Constants.expoConfig?.version ?? null,
        Platform.OS,
        String(Platform.Version),
      ]
    );
    // trim to MAX_ERRORS
    await database.runAsync(
      `DELETE FROM error_log WHERE id NOT IN (
        SELECT id FROM error_log ORDER BY timestamp DESC LIMIT ?
      )`,
      [MAX_ERRORS]
    );
  } catch {
    // If DB write fails, silently ignore — never crash the crash handler
  }
}

export async function getRecentErrors(limit = 20): Promise<ErrorEntry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ErrorRow>(
    "SELECT * FROM error_log ORDER BY timestamp DESC LIMIT ?",
    [limit]
  );
  return rows.map(mapRow);
}

export async function getErrorCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM error_log"
  );
  return row?.count ?? 0;
}

export async function clearErrorLog(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM error_log");
}

export async function generateReport(): Promise<string> {
  const errors = await getRecentErrors(MAX_ERRORS);
  return JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      app_version: Constants.expoConfig?.version ?? "unknown",
      platform: Platform.OS,
      os_version: String(Platform.Version),
      error_count: errors.length,
      errors,
    },
    null,
    2
  );
}

let installed = false;

export function setupGlobalHandler(): void {
  if (installed) return;
  installed = true;

  const prev = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, fatal?: boolean) => {
    logError(error, { fatal: fatal ?? true });
    prev(error, fatal);
  });
}
