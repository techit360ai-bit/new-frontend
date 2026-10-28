import { expect, test, vi } from 'vitest';
import { fetchIdempotent } from './retry';

test('retries transient idempotent reads within a fixed limit', async () => {
  const run = vi.fn()
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValue(new Response('{}', { status: 200 }));
  await expect(fetchIdempotent(run)).resolves.toBeInstanceOf(Response);
  expect(run).toHaveBeenCalledTimes(2);
});

test('does not retry permanent client responses', async () => {
  const run = vi.fn().mockResolvedValue(new Response('{}', { status: 403 }));
  await expect(fetchIdempotent(run)).resolves.toMatchObject({ status: 403 });
  expect(run).toHaveBeenCalledTimes(1);
});
