import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string | null;
}

export function useFormValidation(rules: ValidationRules, initialValues: Record<string, any> = {}) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [values, setValues] = useState<Record<string, any>>(initialValues);

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${name} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Min length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      return `${name} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      return `${name} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((data: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField]);

  const validateFieldOnChange = useCallback((name: string, value: any) => {
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));
  }, []);

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    validateFieldOnChange(name, value);
  }, [validateFieldOnChange]);

  const handleBlur = useCallback((name: string) => {
    validateFieldOnChange(name, values[name]);
  }, [validateFieldOnChange, values]);

  const isValid = !Object.values(errors).some(error => error !== null);

  return {
    errors,
    values,
    setValue,
    handleBlur,
    validateForm,
    validateFieldOnChange,
    clearErrors,
    clearFieldError,
    hasErrors: Object.values(errors).some(error => error !== null),
    isValid
  };
}
