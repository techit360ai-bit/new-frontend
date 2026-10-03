import { afterEach, describe, expect, it } from 'vitest';
import { classifyFailure, failureMessage, isNetworkFailure } from './connectivity';

function setOnline(value: boolean) {
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: value }, configurable: true, writable: true });
}

afterEach(() => setOnline(true));

describe('classifyFailure', () => {
  it('treats a browser TypeError as unreachable, not offline, while the device is online', () => {
    expect(classifyFailure(new TypeError('Failed to fetch'))).toBe('unreachable');
  });

  it('classifies HTTP statuses', () => {
    expect(classifyFailure({ status: 401 })).toBe('auth');
    expect(classifyFailure({ status: 500 })).toBe('server');
    expect(classifyFailure({ status: 422 })).toBe('client');
  });

  it('classifies timeouts', () => {
    const error = Object.assign(new Error('timeout'), { name: 'TimeoutError' });
    expect(classifyFailure(error)).toBe('timeout');
  });

  it('only reports offline when the device has no network', () => {
    setOnline(false);
    expect(classifyFailure(new TypeError('Failed to fetch'))).toBe('offline');
  });
});

describe('isNetworkFailure', () => {
  it('is retryable for transport failures', () => {
    expect(isNetworkFailure(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkFailure(Object.assign(new Error('t'), { name: 'TimeoutError' }))).toBe(true);
  });

  it('does not queue writes on server rejections', () => {
    expect(isNetworkFailure({ status: 500 })).toBe(false);
    expect(isNetworkFailure({ status: 403 })).toBe(false);
  });
});

describe('failureMessage', () => {
  it('never claims the user is offline for a reachable-but-down service', () => {
    const message = failureMessage(new TypeError('Failed to fetch'), 'feed');
    expect(message).not.toMatch(/offline/i);
    expect(message).toMatch(/couldn't reach/i);
  });

  it('gives an actionable incubation message', () => {
    expect(failureMessage(new TypeError('Failed to fetch'), 'incubation')).toMatch(/wasn't submitted/i);
  });

  it('uses an honest offline message when the device is actually offline', () => {
    setOnline(false);
    expect(failureMessage(new TypeError('Failed to fetch'), 'feed')).toMatch(/offline/i);
  });
});
