import path from 'node:path';
import { access, mkdir } from 'node:fs/promises';

const DEFAULT_STORAGE_STATE_PATH = path.join(
  process.cwd(),
  '.job-bot',
  'glints-storage-state.json'
);
const DEFAULT_PROFILE_PATH = path.join(process.cwd(), '.job-bot', 'glints-chrome-profile');

export function storageStatePath(): string {
  return process.env.GLINTS_STORAGE_STATE_PATH || DEFAULT_STORAGE_STATE_PATH;
}

export function glintsProfilePath(): string {
  return process.env.GLINTS_PROFILE_PATH || DEFAULT_PROFILE_PATH;
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureGlintsSessionDir(): Promise<string> {
  const statePath = storageStatePath();
  await mkdir(path.dirname(statePath), { recursive: true });
  await mkdir(glintsProfilePath(), { recursive: true });
  return statePath;
}

export async function hasGlintsSession(): Promise<boolean> {
  return exists(storageStatePath());
}
