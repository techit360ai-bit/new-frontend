import { describe, expect, it } from 'vitest';
import { treeFromFiles, webContainerPreflight } from './webContainer';

describe('WebContainer runtime boundary', () => {
  it('accepts an isolated secure browser with the required runtime primitives', () => {
    expect(webContainerPreflight({
      crossOriginIsolated: true,
      isSecureContext: true,
      SharedArrayBuffer,
      WebAssembly,
      Worker: class {},
      location: { hostname: 'app.techit.example' },
    })).toEqual({ supported: true, problems: [] });
  });

  it('reports deterministic reasons when browser execution cannot start', () => {
    const result = webContainerPreflight({
      crossOriginIsolated: false,
      isSecureContext: false,
      location: { hostname: 'app.techit.example' },
    });
    expect(result.supported).toBe(false);
    expect(result.problems).toContain('HTTPS is required');
    expect(result.problems).toContain('cross-origin isolation is unavailable');
  });

  it('mounts project-relative files into a WebContainer tree', () => {
    expect(treeFromFiles([{ path: 'src/App.tsx', content: 'export default 1' }])).toEqual({
      src: { directory: { 'App.tsx': { file: { contents: 'export default 1' } } } },
    });
  });
});
