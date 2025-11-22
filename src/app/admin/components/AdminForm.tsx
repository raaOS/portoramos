'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import { useToast } from '@/contexts/ToastContext';

interface AdminFormProps {
  initialValues: Record<string, any>;
  validationRules: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  children: (form: any) => ReactNode;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
}

export default function AdminForm({
  initialValues,
  validationRules,
  onSubmit,
  children,
  autoSave = false,
  autoSaveDelay = 5000,
  className = ''
}: AdminFormProps) {
  const { showSuccess: success, showError } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  const form = useFormValidation(validationRules, initialValues);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const currentValues = JSON.stringify(form.values);

    // Only auto-save if values have changed and form is valid
    if (currentValues !== lastSavedRef.current && !form.hasErrors) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSubmit(form.values);
          lastSavedRef.current = currentValues;
          // Show subtle success indicator
          if (process.env.NODE_ENV === 'development') {
            console.log('Auto-saved successfully');
          }
        } catch (err) {
          console.error('Auto-save failed:', err);
        }
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [form.values, form.hasErrors, autoSave, autoSaveDelay, onSubmit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = form.validateForm(form.values);
    if (!isValid) {
      showError('Please fix the highlighted fields before saving.');
      return;
    }

    try {
      await onSubmit(form.values);
    } catch (err) {
      console.error('Form submission failed:', err);
      showError('Failed to submit form. Please try again.');
    }
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children(form)}
    </form>
  );
}
