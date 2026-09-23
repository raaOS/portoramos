'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import type { Project } from '@/types/projects';
import { collectProjectTranslationFields } from '../utils/translations';

export function useProjectTranslations(project: Project) {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const CACHE_KEY = `gemini_proj_v2_${project.slug}`;

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        startTransition(() => {
          setTranslations(JSON.parse(cached));
        });
      }
    } catch {
      /* ignore */
    }
  }, [CACHE_KEY, project.slug]);

  const translateAll = useCallback(async () => {
    if (translations) {
      setTranslations(null);
      return;
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setTranslations(JSON.parse(cached));
        return;
      }
    } catch {
      /* ignore */
    }

    setTranslateLoading(true);
    try {
      const fields = collectProjectTranslationFields(project);
      if (Object.keys(fields).length === 0) return;

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const data = await res.json();
      if (res.ok && data.translations) {
        setTranslations(data.translations);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.translations));
        } catch {
          /* ignore */
        }
      } else {
        console.warn('[useProjectTranslations] Translation failed:', data.error || res.statusText);
      }
    } catch (error) {
      console.warn('[useProjectTranslations] Translation failed:', error);
    } finally {
      setTranslateLoading(false);
    }
  }, [project, translations, CACHE_KEY]);

  return {
    translations,
    setTranslations,
    translateLoading,
    translateAll,
  };
}
