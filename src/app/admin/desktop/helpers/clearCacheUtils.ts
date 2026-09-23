import type {
  ClearCacheProgressStep,
  ClearCacheStepStatus,
} from '../../components/ClearCacheProgressModal';

export type ServerCacheStep = {
  name: string;
  status: 'cleared' | 'skipped' | 'error';
  detail: string;
  entriesCleared?: number;
};

export type ClearCacheResponse = {
  success?: boolean;
  message?: string;
  details?: {
    serverMemory?: ServerCacheStep[];
    nextFilesystem?: ServerCacheStep[];
    cloudflareCdn?: ServerCacheStep;
  };
};

export const CACHE_STEP_DEFINITIONS: Array<Pick<ClearCacheProgressStep, 'id' | 'label'>> = [
  { id: 'serverRequest', label: 'Hubungi server admin' },
  { id: 'nextRevalidate', label: 'Revalidate cache Next.js' },
  { id: 'serverMemory', label: 'Clear in-memory cache service' },
  { id: 'nextFilesystem', label: 'Clear .next cache lokal' },
  { id: 'cloudflareCdn', label: 'Purge Cloudflare CDN/R2 edge' },
  { id: 'reactQuery', label: 'Clear React Query cache' },
  { id: 'browserCache', label: 'Clear browser Cache Storage' },
  { id: 'serviceWorker', label: 'Refresh service worker' },
  { id: 'uiRefresh', label: 'Refresh tampilan admin' },
];

export function createInitialCacheSteps(): ClearCacheProgressStep[] {
  return CACHE_STEP_DEFINITIONS.map((step) => ({
    ...step,
    status: 'pending',
  }));
}

export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function mapServerStatus(status?: ServerCacheStep['status']): ClearCacheStepStatus {
  if (status === 'cleared') return 'done';
  if (status === 'skipped') return 'skipped';
  if (status === 'error') return 'error';
  return 'skipped';
}

export function summarizeServerSteps(steps?: ServerCacheStep[]): {
  status: ClearCacheStepStatus;
  detail: string;
} {
  if (!steps || steps.length === 0) {
    return { status: 'skipped', detail: 'Tidak ada cache terdaftar di runtime ini.' };
  }

  const errored = steps.find((step) => step.status === 'error');
  if (errored) {
    return { status: 'error', detail: `${errored.name}: ${errored.detail}` };
  }

  const skipped = steps.every((step) => step.status === 'skipped');
  if (skipped) {
    return {
      status: 'skipped',
      detail: steps.map((step) => `${step.name}: ${step.detail}`).join(' | '),
    };
  }

  const entriesCleared = steps.reduce((sum, step) => sum + (step.entriesCleared ?? 0), 0);
  return {
    status: 'done',
    detail: `${entriesCleared} entry dibersihkan dari ${steps.length} cache service.`,
  };
}
