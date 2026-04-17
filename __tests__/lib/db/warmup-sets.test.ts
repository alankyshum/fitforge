// Unit tests for warm-up set tagging (Phase 45)
const mockStmt = {
  executeAsync: jest.fn().mockResolvedValue({ changes: 1 }),
  finalizeAsync: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
  prepareAsync: jest.fn().mockResolvedValue(mockStmt),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
}));

import {
  updateSetWarmup,
  addSet,
  getSessionSets,
  getSessionSetCount,
  getPersonalRecords,
} from '../../../lib/db/sessions';

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.getAllAsync.mockResolvedValue([]);
  mockDb.getFirstAsync.mockResolvedValue(null);
  mockDb.runAsync.mockResolvedValue({ changes: 1 });
  mockDb.withTransactionAsync.mockImplementation(async (cb: () => Promise<void>) => cb());
});

// ---- updateSetWarmup ----

describe('updateSetWarmup', () => {
  it('sets is_warmup = 1 when true', async () => {
    await updateSetWarmup('set-1', true);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE workout_sets SET is_warmup = ? WHERE id = ?',
      [1, 'set-1']
    );
  });

  it('sets is_warmup = 0 when false', async () => {
    await updateSetWarmup('set-2', false);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE workout_sets SET is_warmup = ? WHERE id = ?',
      [0, 'set-2']
    );
  });
});

// ---- addSet includes is_warmup ----

describe('addSet with isWarmup', () => {
  it('inserts set with is_warmup = 1 when isWarmup is true', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ next: 2 });
    const result = await addSet('sess-1', 'ex-1', 1, null, null, null, null, true);

    const insertCall = mockDb.runAsync.mock.calls.find(
      (c: string[]) => typeof c[0] === 'string' && c[0].includes('INSERT INTO workout_sets')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall![0]).toContain('is_warmup');
    // Last param should be 1
    const params = insertCall![1] as unknown[];
    expect(params[params.length - 1]).toBe(1);
    expect(result.is_warmup).toBe(true);
  });

  it('inserts set with is_warmup = 0 by default', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ next: 1 });
    const result = await addSet('sess-1', 'ex-1', 1);

    const insertCall = mockDb.runAsync.mock.calls.find(
      (c: string[]) => typeof c[0] === 'string' && c[0].includes('INSERT INTO workout_sets')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall![0]).toContain('is_warmup');
    const params = insertCall![1] as unknown[];
    expect(params[params.length - 1]).toBe(0);
    expect(result.is_warmup).toBe(false);
  });
});

// ---- getSessionSets includes is_warmup (no filter) ----

describe('getSessionSets', () => {
  it('maps is_warmup from integer to boolean', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: 's1', session_id: 'sess-1', exercise_id: 'ex-1',
        set_number: 1, weight: 100, reps: 5, completed: 1,
        completed_at: null, rpe: null, notes: null,
        exercise_name: 'Squat', link_id: null, round: null,
        training_mode: null, tempo: null,
        swapped_from_exercise_id: null, is_warmup: 1,
      },
      {
        id: 's2', session_id: 'sess-1', exercise_id: 'ex-1',
        set_number: 2, weight: 100, reps: 5, completed: 1,
        completed_at: null, rpe: null, notes: null,
        exercise_name: 'Squat', link_id: null, round: null,
        training_mode: null, tempo: null,
        swapped_from_exercise_id: null, is_warmup: 0,
      },
    ]);

    const sets = await getSessionSets('sess-1');
    expect(sets[0].is_warmup).toBe(true);
    expect(sets[1].is_warmup).toBe(false);
  });
});

// ---- Metric queries exclude warm-ups ----

describe('metric queries exclude warm-ups', () => {
  it('getSessionSetCount excludes warm-up sets', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ cnt: 3 });
    await getSessionSetCount('sess-1');

    const call = mockDb.getFirstAsync.mock.calls[0];
    expect(call[0]).toContain('is_warmup = 0');
  });

  it('getPersonalRecords excludes warm-up sets', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getPersonalRecords();

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('is_warmup = 0');
  });
});
