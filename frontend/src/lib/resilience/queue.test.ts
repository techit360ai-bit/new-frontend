import { beforeEach, describe, expect, test } from 'vitest';
import { clearMemoryForTests, list } from './store';
import { enqueue, pendingOperations, replay } from './queue';

describe('resilience queue', () => {
  beforeEach(() => clearMemoryForTests());

  test('persists pending operations and replays them once', async () => {
    const operation = await enqueue({ type: 'draft.save', endpoint: '/drafts', payload: { body: 'hello' } });
    expect((await pendingOperations()).map(item => item.id)).toEqual([operation.id]);
    const result = await replay(async item => {
      expect(item.id).toBe(operation.id);
      return 'completed';
    });
    expect(result).toMatchObject({ completed: 1, failed: 0, conflicts: 0, remaining: 0 });
    expect(await list('operations')).toEqual([]);
  });

  test('retains failures and records conflicts', async () => {
    await enqueue({ type: 'draft.save', payload: {} });
    await enqueue({ type: 'draft.save', payload: {} });
    let calls = 0;
    const result = await replay(async () => {
      calls += 1;
      if (calls === 1) return 'conflict';
      throw new Error('temporary failure');
    });
    expect(result.conflicts).toBe(1);
    expect(result.failed).toBe(1);
    expect((await list<{ status: string }>('operations')).some(item => item.status === 'conflict')).toBe(true);
  });
});
