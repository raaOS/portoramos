'use client';
/**
 * Confirm Dialog — Dialog konfirmasi reusable untuk operasi admin.
 *
 * Menyediakan context provider dan hook `useConfirm()` untuk menampilkan
 * dialog konfirmasi sebelum operasi destruktif (hapus, reset, dll.).
 *
 * @module components/admin/ConfirmDialog
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ConfirmRequest,
  PromptRequest,
  ConfirmContextValue,
  PendingState,
} from './confirm-dialog/types';
import { ConfirmContext } from './confirm-dialog/useConfirm';
import { ConfirmDialogModal } from './confirm-dialog/ConfirmDialogModal';

export type { ConfirmRequest, PromptRequest, ConfirmTone } from './confirm-dialog/types';
export { useConfirm } from './confirm-dialog/useConfirm';

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

  useEffect(() => {
    if (!pending) {
      dialogRef.current?.close();
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();

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

  return (
    <ConfirmContext.Provider value={ctx}>
      {children}
      <ConfirmDialogModal
        pending={pending}
        dialogRef={dialogRef}
        inputRef={inputRef}
        confirmBtnRef={confirmBtnRef}
        cancelBtnRef={cancelBtnRef}
        inputValue={inputValue}
        validationError={validationError}
        setInputValue={setInputValue}
        setValidationError={setValidationError}
        accept={accept}
        cancel={cancel}
        onNativeClose={onNativeClose}
      />
    </ConfirmContext.Provider>
  );
}
