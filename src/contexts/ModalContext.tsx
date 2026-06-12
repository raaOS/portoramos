'use client';

/**
 * Modal Context — Global modal dialog state management.
 *
 * Menyediakan API `openModal(content)` / `closeModal()` yang digunakan
 * oleh komponen di seluruh aplikasi untuk menampilkan dialog modal.
 *
 * @module ModalContext
 */
import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(() => ({ isModalOpen, setIsModalOpen }), [isModalOpen]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
