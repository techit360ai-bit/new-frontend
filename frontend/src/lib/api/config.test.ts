import { describe, expect, test } from 'vitest';
import { apiFallbackEnabled, isProductionBuild } from './config';
import { messagingFallbackEnabled } from '../messaging/config';

describe('apiFallbackEnabled', () => {
  test('production build is always strict, even when VITE_API_FALLBACK=1', () => {
    expect(apiFallbackEnabled({ PROD: true, MODE: 'production', VITE_API_FALLBACK: '1' })).toBe(false);
    expect(messagingFallbackEnabled({ PROD: true, MODE: 'production', VITE_API_FALLBACK: '1' })).toBe(false);
  });

  test('explicit VITE_API_STRICT=1 disables fallback in dev', () => {
    expect(apiFallbackEnabled({ MODE: 'development', VITE_API_STRICT: '1' })).toBe(false);
    expect(messagingFallbackEnabled({ MODE: 'development', VITE_API_STRICT: '1' })).toBe(false);
  });

  test('development keeps the opt-in fallback', () => {
    expect(apiFallbackEnabled({ MODE: 'development' })).toBe(true);
    expect(messagingFallbackEnabled({ MODE: 'development' })).toBe(true);
  });

  test('VITE_API_FALLBACK=0 disables fallback in dev', () => {
    expect(apiFallbackEnabled({ MODE: 'development', VITE_API_FALLBACK: '0' })).toBe(false);
  });

  test('isProductionBuild detects PROD or MODE=production', () => {
    expect(isProductionBuild({ PROD: true })).toBe(true);
    expect(isProductionBuild({ MODE: 'production' })).toBe(true);
    expect(isProductionBuild({ MODE: 'development' })).toBe(false);
  });
});
