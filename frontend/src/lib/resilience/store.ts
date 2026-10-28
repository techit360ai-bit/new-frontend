export type ResilienceStoreName = 'snapshots' | 'drafts' | 'operations' | 'meta';

export interface ResilienceSnapshot<T = unknown> {
  key: string;
  value: T;
  updatedAt: string;
  expiresAt?: string;
}

export interface ResilienceOperation<T = unknown> {
  id: string;
  type: string;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  payload: T;
  entityKey?: string;
  baseVersion?: number | string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  status: 'pending' | 'syncing' | 'failed' | 'conflict' | 'completed';
  lastError?: string;
}

const DB_NAME = 'techit-resilience';
const DB_VERSION = 1;
const stores: ResilienceStoreName[] = ['snapshots', 'drafts', 'operations', 'meta'];
const memory = new Map<ResilienceStoreName, Map<string, unknown>>(stores.map(name => [name, new Map()]));

function supported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      stores.forEach(name => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'key' }); });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Offline storage unavailable'));
  });
}

function recordKey(value: { key?: string; id?: string }): string {
  return value.key || value.id || '';
}

export async function put<T extends { key?: string; id?: string }>(store: ResilienceStoreName, value: T): Promise<T> {
  const key = recordKey(value);
  if (!key) throw new Error('Offline record key is required');
  if (!supported()) { memory.get(store)!.set(key, value); return value; }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put({ ...value, key });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Offline write failed'));
  });
  db.close();
  return value;
}

export async function get<T>(store: ResilienceStoreName, key: string): Promise<T | null> {
  if (!supported()) return (memory.get(store)!.get(key) as T | undefined) || null;
  const db = await openDb();
  const value = await new Promise<T | null>((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) || null);
    request.onerror = () => reject(request.error || new Error('Offline read failed'));
  });
  db.close();
  return value;
}

export async function list<T>(store: ResilienceStoreName): Promise<T[]> {
  if (!supported()) return [...memory.get(store)!.values()] as T[];
  const db = await openDb();
  const values = await new Promise<T[]>((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll();
    request.onsuccess = () => resolve((request.result || []) as T[]);
    request.onerror = () => reject(request.error || new Error('Offline list failed'));
  });
  db.close();
  return values;
}

export async function remove(store: ResilienceStoreName, key: string): Promise<void> {
  if (!supported()) { memory.get(store)!.delete(key); return; }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Offline delete failed'));
  });
  db.close();
}

export function clearMemoryForTests(): void {
  memory.forEach(value => value.clear());
}
