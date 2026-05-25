'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * App-styled confirm/prompt dialog provider.
 *
 * Drop-in replacement for `window.confirm()` / `window.prompt()` so admin UIs
 * can use a consistent, branded modal instead of the OS dialog. Built on
 * native `<dialog>` so we get focus trap, ESC handling, and screen-reader
 * semantics from the platform — no library required.
 *
 * Usage:
 *   const { confirm, prompt } = useConfirm();
 *   const ok = await confirm({ title, message, tone: 'danger' });
 *   const name = await prompt({ title, defaultValue: 'New name' });
 */

type ConfirmTone = 'danger' | 'warning' | 'info';

interface BaseRequest {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

export type ConfirmRequest = BaseRequest;

export interface PromptRequest extends BaseRequest {
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  /** Sync validator. Return non-empty string to block confirm. */
  validate?: (value: string) => string | null;
  /** Trim before resolving. Defaults to true. */
  trim?: boolean;
  /** Reject empty value. Defaults to true. */
  required?: boolean;
}

interface ConfirmContextValue {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  prompt: (request: PromptRequest) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface PendingState {
  kind: 'confirm' | 'prompt';
  request: ConfirmRequest | PromptRequest;
  resolve: (value: boolean | string | null) => void;
}

const TONE_PALETTE: Record<
  ConfirmTone,
  {
    Icon: typeof AlertTriangle;
    iconWrap: string;
    iconColor: string;
    confirmBtn: string;
  }
> = {
  danger: {
    Icon: AlertTriangle,
    iconWrap: 'bg-red-50',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
  },
  warning: {
    Icon: AlertCircle,
    iconWrap: 'bg-amber-50',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
  },
  info: {
    Icon: Info,
    iconWrap: 'bg-blue-50',
    iconColor: 'text-blue-600',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
  },
};

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback((request: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      setPending({
        kind: 'confirm',
        request,
        resolve: (v) => resolve(v as boolean),
      });
    });
  }, []);

  const prompt = useCallback((request: PromptRequest) => {
    return new Promise<string | null>((resolve) => {
      setInputValue(request.defaultValue ?? '');
      setValidationError(null);
      setPending({
        kind: 'prompt',
        request,
        resolve: (v) => resolve(v as string | null),
      });
    });
  }, []);

  // Open <dialog> imperatively so we get focus trap + ESC handling for free.
  useEffect(() => {
    if (!pending) {
      dialogRef.current?.close();
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();

    // Default focus: prompts focus the input, destructive confirms focus
    // the cancel button (so a stray Enter doesn't trigger the action).
    const tone = pending.request.tone ?? 'info';
    if (pending.kind === 'prompt') {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (tone === 'danger') {
      cancelBtnRef.current?.focus();
    } else {
      confirmBtnRef.current?.focus();
    }
  }, [pending]);

  const cancel = useCallback(() => {
    if (!pending) return;
    const fallback = pending.kind === 'prompt' ? null : false;
    pending.resolve(fallback);
    setPending(null);
  }, [pending]);

  const accept = useCallback(() => {
    if (!pending) return;
    if (pending.kind === 'confirm') {
      pending.resolve(true);
      setPending(null);
      return;
    }
    const req = pending.request as PromptRequest;
    const value = req.trim === false ? inputValue : inputValue.trim();
    if (req.required !== false && value.length === 0) {
      setValidationError('Tidak boleh kosong');
      return;
    }
    const customError = req.validate?.(value);
    if (customError) {
      setValidationError(customError);
      return;
    }
    pending.resolve(value);
    setPending(null);
  }, [pending, inputValue]);

  const onNativeClose = useCallback(() => {
    if (pending) cancel();
  }, [pending, cancel]);

  const ctx = useMemo<ConfirmContextValue>(() => ({ confirm, prompt }), [confirm, prompt]);

  const tone = pending?.request.tone ?? 'info';
  const palette = TONE_PALETTE[tone];
  const Icon = palette.Icon;
  const promptReq = pending?.kind === 'prompt' ? (pending.request as PromptRequest) : null;

  return (
    <ConfirmContext.Provider value={ctx}>
      {children}

      <dialog
        ref={dialogRef}
        onClose={onNativeClose}
        onClick={(e) => {
          // Backdrop click: only close when the click hit the
          // <dialog> element itself, not the inner card.
          if (e.target === dialogRef.current) cancel();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-transparent p-0 shadow-2xl backdrop:bg-black/55 backdrop:backdrop-blur-sm"
      >
        {pending && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* Close button — pinned to the top-right corner. */}
            <button
              type="button"
              onClick={cancel}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4 p-5 pr-12">
              <div className={`rounded-xl p-2.5 ${palette.iconWrap} shrink-0`}>
                <Icon className={`h-5 w-5 ${palette.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-tight text-gray-900">
                  {pending.request.title}
                </h2>
                {pending.request.message && (
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                    {pending.request.message}
                  </p>
                )}

                {promptReq && (
                  <div className="mt-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      placeholder={promptReq.placeholder}
                      maxLength={promptReq.maxLength}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          accept();
                        }
                      }}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors ${
                        validationError
                          ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                    />
                    {validationError && (
                      <p className="mt-1.5 text-xs text-red-600">{validationError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
              <button
                type="button"
                ref={cancelBtnRef}
                onClick={cancel}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900"
              >
                {pending.request.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                ref={confirmBtnRef}
                onClick={accept}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold text-white transition-colors ${palette.confirmBtn}`}
              >
                {pending.request.confirmText || (pending.kind === 'prompt' ? 'Simpan' : 'OK')}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within <ConfirmDialogProvider>');
  }
  return ctx;
}
