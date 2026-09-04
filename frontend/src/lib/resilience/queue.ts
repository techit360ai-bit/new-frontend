import { list, put, remove, type ResilienceOperation } from './store';

export interface QueueReplayResult { completed: number; failed: number; conflicts: number; remaining: number }

function operationId(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto?.getRandomValues?.(bytes);
  const entropy = `${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}_${Math.random().toString(36).slice(2, 10)}`;
  return `offline_${Date.now().toString(36)}_${entropy}`;
}

export async function enqueue<T>(input: Omit<ResilienceOperation<T>, 'id' | 'createdAt' | 'updatedAt' | 'attempts' | 'status'>): Promise<ResilienceOperation<T>> {
  const now = new Date().toISOString();
  const operation: ResilienceOperation<T> = { ...input, id: operationId(), createdAt: now, updatedAt: now, attempts: 0, status: 'pending' };
  await put('operations', operation);
  return operation;
}

export async function pendingOperations(): Promise<ResilienceOperation[]> {
  return (await list<ResilienceOperation>('operations')).filter(item => item.status === 'pending' || item.status === 'failed').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function replay(executor: (operation: ResilienceOperation) => Promise<'completed' | 'conflict'>): Promise<QueueReplayResult> {
  const operations = await pendingOperations();
  let completed = 0; let failed = 0; let conflicts = 0;
  for (const operation of operations) {
    const syncing = { ...operation, status: 'syncing' as const, updatedAt: new Date().toISOString() };
    await put('operations', syncing);
    try {
      const result = await executor(syncing);
      if (result === 'conflict') { conflicts++; await put('operations', { ...syncing, status: 'conflict', updatedAt: new Date().toISOString() }); }
      else { completed++; await remove('operations', syncing.id); }
    } catch (error) {
      failed++;
      await put('operations', { ...syncing, status: 'failed', attempts: syncing.attempts + 1, lastError: error instanceof Error ? error.message : 'Sync failed', updatedAt: new Date().toISOString() });
    }
  }
  return { completed, failed, conflicts, remaining: (await pendingOperations()).length };
}
