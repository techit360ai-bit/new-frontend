import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export interface PromptOptions {
  title: string;
  label?: string;
  initial?: string;
  placeholder?: string;
  confirmLabel?: string;
  multiline?: boolean;
  sensitive?: boolean;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Pending =
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void }
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void };

/**
 * Promise-based in-app prompt/confirm. Replaces window.prompt/window.confirm for the
 * coding area (T4.3): the dialogs are real DOM nodes, so they are testable and are
 * not blocked by the browser or sandboxed preview iframes.
 */
export function useActionDialogs(): {
  prompt: (options: PromptOptions) => Promise<string | null>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialogs: ReactNode;
} {
  const [pending, setPending] = useState<Pending | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const prompt = useCallback((options: PromptOptions) => new Promise<string | null>((resolve) => {
    setValue(options.initial ?? '');
    setPending({ kind: 'prompt', options, resolve });
  }), []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setPending({ kind: 'confirm', options, resolve });
  }), []);

  const settle = useCallback((result: string | null | boolean) => {
    setPending((current) => {
      if (current) (current.resolve as (value: string | null | boolean) => void)(result);
      return null;
    });
  }, []);

  useEffect(() => {
    if (pending) inputRef.current?.focus();
  }, [pending]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); settle(pending?.kind === 'prompt' ? null : false); }
    if (event.key === 'Enter' && pending?.kind === 'prompt' && !pending.options.multiline) { event.preventDefault(); settle(value); }
  };

  const dialogs = pending ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) settle(pending.kind === 'prompt' ? null : false); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={pending.options.title}
        onKeyDown={onKeyDown}
        className="w-full max-w-md space-y-3 rounded-lg border border-border-inverse-strong bg-background-inverse p-4 text-text-on-inverse shadow-xl"
      >
        <p className="text-sm font-medium">{pending.options.title}</p>
        {pending.kind === 'confirm' && pending.options.description && (
          <p className="text-xs text-text-on-inverse-secondary">{pending.options.description}</p>
        )}
        {pending.kind === 'prompt' && (
          <div className="space-y-1">
            {pending.options.label && <label className="block text-xs text-text-on-inverse-secondary">{pending.options.label}</label>}
            {pending.options.multiline ? (
              <textarea
                ref={(node) => { inputRef.current = node; }}
                value={value}
                rows={4}
                placeholder={pending.options.placeholder}
                onChange={(event) => setValue(event.target.value)}
                className="w-full rounded border border-border-inverse-strong bg-background-inverse p-2 text-sm"
              />
            ) : (
              <input
                ref={(node) => { inputRef.current = node; }}
                value={value}
                type={pending.options.sensitive ? 'password' : 'text'}
                autoComplete="off"
                placeholder={pending.options.placeholder}
                onChange={(event) => setValue(event.target.value)}
                className="w-full rounded border border-border-inverse-strong bg-background-inverse p-2 text-sm"
              />
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => settle(pending.kind === 'prompt' ? null : false)}
            className="toolbar-button"
          >
            {pending.kind === 'confirm' ? (pending.options.cancelLabel || 'Cancel') : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => settle(pending.kind === 'prompt' ? value : true)}
            disabled={pending.kind === 'prompt' && !value.trim()}
            className={`toolbar-button ${pending.kind === 'confirm' && pending.options.destructive ? 'border-status-error text-status-error' : 'border-brand-accent text-brand-accent'}`}
          >
            {pending.kind === 'confirm' ? (pending.options.confirmLabel || 'Confirm') : (pending.options.confirmLabel || 'Save')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { prompt, confirm, dialogs };
}
