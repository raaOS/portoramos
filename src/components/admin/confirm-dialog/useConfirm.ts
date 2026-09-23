'use client';

import { createContext, useContext } from 'react';
import { ConfirmContextValue } from './types';

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within <ConfirmDialogProvider>');
  }
  return ctx;
}
