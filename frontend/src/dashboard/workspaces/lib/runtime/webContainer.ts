import type { FileSystemTree, WebContainer, WebContainerProcess } from '@webcontainer/api';

export type WebContainerFailureCode =
  | 'unsupported_environment'
  | 'worker_timeout'
  | 'boot_failed';

export class WebContainerRuntimeError extends Error {
  readonly code: WebContainerFailureCode;
  readonly reloadRequired: boolean;

  constructor(
    message: string,
    code: WebContainerFailureCode,
    reloadRequired = false,
  ) {
    super(message);
    this.name = 'WebContainerRuntimeError';
    this.code = code;
    this.reloadRequired = reloadRequired;
  }
}

type RuntimeEnvironment = {
  crossOriginIsolated?: boolean;
  isSecureContext?: boolean;
  SharedArrayBuffer?: unknown;
  WebAssembly?: unknown;
  Worker?: unknown;
  location?: { hostname?: string };
};

export function webContainerPreflight(environment: RuntimeEnvironment = globalThis): {
  supported: boolean;
  problems: string[];
} {
  const hostname = environment.location?.hostname || '';
  const local = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const problems: string[] = [];
  if (!environment.isSecureContext && !local) problems.push('HTTPS is required');
  if (!environment.crossOriginIsolated) problems.push('cross-origin isolation is unavailable');
  if (typeof environment.SharedArrayBuffer === 'undefined') problems.push('SharedArrayBuffer is unavailable');
  if (typeof environment.WebAssembly === 'undefined') problems.push('WebAssembly is unavailable');
  if (typeof environment.Worker === 'undefined') problems.push('Web Workers are unavailable');
  return { supported: problems.length === 0, problems };
}

let instance: WebContainer | null = null;
let booting: Promise<WebContainer> | null = null;
let activeProcess: WebContainerProcess | null = null;
let stalledBoot: WebContainerRuntimeError | null = null;

function beginBoot(): Promise<WebContainer> {
  const support = webContainerPreflight();
  if (!support.supported) {
    return Promise.reject(new WebContainerRuntimeError(
      `Browser execution is unavailable: ${support.problems.join(', ')}. You can continue editing manually.`,
      'unsupported_environment',
    ));
  }
  return import('@webcontainer/api').then(({ WebContainer }) => WebContainer.boot({
    coep: 'require-corp',
    forwardPreviewErrors: 'exceptions-only',
  }));
}

export async function bootWebContainer(timeoutMs = 45_000): Promise<WebContainer> {
  if (instance) return instance;
  if (stalledBoot) throw stalledBoot;
  if (!booting) booting = beginBoot();

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    instance = await Promise.race([
      booting,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new WebContainerRuntimeError(
          'StackBlitz loaded, but its runtime worker did not respond. Allow StackBlitz/staticblitz third-party storage or network access, then reload this page. Your project files remain available for manual editing.',
          'worker_timeout',
          true,
        )), timeoutMs);
      }),
    ]);
    stalledBoot = null;
    return instance;
  } catch (error) {
    if (error instanceof WebContainerRuntimeError && error.code === 'worker_timeout') {
      stalledBoot = error;
      void booting.then(container => {
        instance = container;
        stalledBoot = null;
      }).catch(() => undefined);
    } else {
      booting = null;
    }
    if (error instanceof WebContainerRuntimeError) throw error;
    throw new WebContainerRuntimeError(
      `WebContainer failed to start: ${error instanceof Error ? error.message : String(error)}`,
      'boot_failed',
    );
  } finally {
    if (timeout) clearTimeout(timeout);
    if (instance) booting = null;
  }
}

export function treeFromFiles(files: Array<{ path: string; content: string }>): FileSystemTree {
  const root: FileSystemTree = {};
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let level = root;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) level[part] = { file: { contents: file.content } };
      else {
        const existing = level[part];
        if (!existing || !('directory' in existing)) level[part] = { directory: {} };
        level = (level[part] as { directory: FileSystemTree }).directory;
      }
    });
  }
  return root;
}

export async function runWebCommand(
  files: Array<{ path: string; content: string }>,
  command: string,
  onOutput: (chunk: string) => void,
  onServerReady?: (url: string) => void,
  timeoutMs = 120_000,
) {
  const container = await bootWebContainer();
  await container.mount(treeFromFiles(files));
  if (onServerReady) container.on('server-ready', (_port, url) => onServerReady(url));
  const [program, ...args] = command.trim().split(/\s+/);
  if (!program) throw new Error('No adapter command is configured.');
  const process = await container.spawn(program, args);
  activeProcess = process;
  void process.output.pipeTo(new WritableStream({ write(data) { onOutput(data); } }));
  if (onServerReady) return { exitCode: null, process };

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const exitCode = await Promise.race([
      process.exit,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          process.kill();
          reject(new Error(`Command timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
        }, timeoutMs);
      }),
    ]);
    return { exitCode, process };
  } finally {
    if (timeout) clearTimeout(timeout);
    if (activeProcess === process) activeProcess = null;
  }
}

export function stopWebCommand() {
  activeProcess?.kill();
  activeProcess = null;
}

export async function restartWebContainer() {
  stopWebCommand();
  if (stalledBoot?.reloadRequired) throw stalledBoot;
  instance?.teardown();
  instance = null;
  booting = null;
  return bootWebContainer();
}
