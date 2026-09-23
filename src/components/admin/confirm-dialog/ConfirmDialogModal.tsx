'use client';

import React, { RefObject } from 'react';
import { X } from 'lucide-react';
import { PendingState, PromptRequest, TONE_PALETTE } from './types';

interface ConfirmDialogModalProps {
  pending: PendingState | null;
  dialogRef: RefObject<HTMLDialogElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  confirmBtnRef: RefObject<HTMLButtonElement | null>;
  cancelBtnRef: RefObject<HTMLButtonElement | null>;
  inputValue: string;
  validationError: string | null;
  setInputValue: (val: string) => void;
  setValidationError: (val: string | null) => void;
  accept: () => void;
  cancel: () => void;
  onNativeClose: () => void;
}

export function ConfirmDialogModal({
  pending,
  dialogRef,
  inputRef,
  confirmBtnRef,
  cancelBtnRef,
  inputValue,
  validationError,
  setInputValue,
  setValidationError,
  accept,
  cancel,
  onNativeClose,
}: ConfirmDialogModalProps) {
  const tone = pending?.request.tone ?? 'info';
  const palette = TONE_PALETTE[tone];
  const Icon = palette.Icon;
  const promptReq = pending?.kind === 'prompt' ? (pending.request as PromptRequest) : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onNativeClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) cancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-transparent p-0 backdrop:bg-black/55 backdrop:backdrop-blur-sm"
    >
      {pending && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
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
  );
}
