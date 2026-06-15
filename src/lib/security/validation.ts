import { ValidationResult } from './types';

export const validate = {
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  length: (text: string, min: number = 0, max: number = Infinity): boolean => {
    return text.length >= min && text.length <= max;
  },

  alphanumeric: (text: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(text);
  },

  /**
   * Validates if a password meets minimum complexity requirements.
   */
  strongPassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateProjectData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid project data'] };
  }

  const project = data as Record<string, unknown>;

  // Title validation
  if (!project.title || typeof project.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (project.title.length < 1 || project.title.length > 200) {
    errors.push('Title must be between 1 and 200 characters');
  }

  // Description validation
  if (project.description && typeof project.description !== 'string') {
    errors.push('Description must be a string');
  } else if (
    project.description &&
    typeof project.description === 'string' &&
    project.description.length > 2000
  ) {
    errors.push('Description must be less than 2000 characters');
  }

  // URL validation
  if (project.url && typeof project.url === 'string' && !isValidUrl(project.url)) {
    errors.push('Invalid URL format');
  }

  // Technologies validation
  if (project.technologies && !Array.isArray(project.technologies)) {
    errors.push('Technologies must be an array');
  } else if (project.technologies) {
    const techs = project.technologies as unknown[];
    if (techs.some((tech) => typeof tech !== 'string')) {
      errors.push('All technologies must be strings');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
