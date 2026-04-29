// Sistem positions yang simple dan reliable
// localStorage = primary source for ADMIN ONLY, Firebase = template for visitors

import type { WindowPreference } from '@/types/about';

const STORAGE_KEY = 'ramos-positions-v2';
const SESSION_KEY = 'ramos-session-positions'; // For visitor session-only positions

type WindowPosition = { x: number; y: number; width: number; height: number };
type IconPosition = { x: number; y: number };
type NotePosition = { x: number; y: number; width: number; height: number };

interface PositionData {
  windows: Record<string, WindowPosition>;
  icons: Record<string, IconPosition>;
  notes: Record<string, NotePosition>;
}

type PersistedIconPosition = Partial<IconPosition> | null | undefined;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** SSR-safe viewport dimensions helper */
function getCurrentViewport() {
  if (typeof window === 'undefined') return { width: 1440, height: 900 };
  return { width: window.innerWidth, height: window.innerHeight };
}

// Load dari localStorage (ADMIN only)
export function loadPositions(): Partial<PositionData> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

// Load session positions (VISITOR - temporary)
export function loadSessionPositions(): Partial<PositionData> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

// Save session positions (VISITOR - deactivated for "refresh = reset" requirement)
export function saveSessionPositions(_data: Partial<PositionData>) {
  // Visitor changes are no longer persisted to any storage
  return;
}

// Save ke localStorage
export function savePositions(data: Partial<PositionData>) {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadPositions();
    const merged = {
      windows: { ...current.windows, ...data.windows },
      icons: { ...current.icons, ...data.icons },
      notes: { ...current.notes, ...data.notes }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

// Clear visitor positions (called when admin saves new template)
export function clearVisitorPositions() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

// Get position window
export function getWindowPosition(
  id: string,
  firebaseData: WindowPreference | null | undefined,
  defaults: { x: number; y: number; width: number; height: number },
  isAdmin: boolean = false
): { x: number; y: number; width: number; height: number } {
  // 1. Cek localStorage hanya jika admin (sebagai buffer sesi)
  if (isAdmin) {
    const local = loadPositions().windows?.[id];
    if (local) return local;
  }

  const vp = getCurrentViewport();

  // 2. Cek percentage-based position (NEW - responsive)
  if (isFiniteNumber(firebaseData?.xPct) && isFiniteNumber(firebaseData?.yPct)) {
    const x = (firebaseData.xPct! / 100) * vp.width;
    const y = (firebaseData.yPct! / 100) * vp.height;
    const width = isFiniteNumber(firebaseData?.widthPct)
      ? (firebaseData.widthPct! / 100) * vp.width
      : (isFiniteNumber(firebaseData?.width) ? firebaseData.width! : defaults.width);
    const height = isFiniteNumber(firebaseData?.heightPct)
      ? (firebaseData.heightPct! / 100) * vp.height
      : (isFiniteNumber(firebaseData?.height) ? firebaseData.height! : defaults.height);

    // Clamp to viewport with margin
    const margin = 20;
    return {
      x: Math.max(margin, Math.min(x, vp.width - Math.max(width, 300) - margin)),
      y: Math.max(margin, Math.min(y, vp.height - Math.max(height, 200) - margin)),
      width: Math.max(300, Math.min(width, vp.width * 0.95)),
      height: Math.max(200, Math.min(height, vp.height * 0.95))
    };
  }

  // 3. Cek legacy pixel-based position (FALLBACK)
  if (isFiniteNumber(firebaseData?.x) && isFiniteNumber(firebaseData?.y)) {
    const width = isFiniteNumber(firebaseData?.width) ? firebaseData!.width! : defaults.width;
    const height = isFiniteNumber(firebaseData?.height) ? firebaseData!.height! : defaults.height;

    // Clamp legacy values to current viewport
    const margin = 20;
    return {
      x: Math.max(margin, Math.min(firebaseData!.x!, vp.width - Math.max(width, 300) - margin)),
      y: Math.max(margin, Math.min(firebaseData!.y!, vp.height - Math.max(height, 200) - margin)),
      width: Math.max(300, Math.min(width, vp.width * 0.95)),
      height: Math.max(200, Math.min(height, vp.height * 0.95))
    };
  }

  // 4. Default
  return defaults;
}

// Get position icon
export function getIconPosition(
  id: string,
  firebaseData: PersistedIconPosition,
  defaults: { x: number; y: number },
  isAdmin: boolean = false
): { x: number; y: number } {
  // 1. Cek localStorage hanya jika admin
  if (isAdmin) {
    const local = loadPositions().icons?.[id];
    if (local) return local;
  }
  
  if (isFiniteNumber(firebaseData?.x) && isFiniteNumber(firebaseData?.y)) {
    return { x: firebaseData.x, y: firebaseData.y };
  }
  
  return defaults;
}

// Save single window position
export function saveWindowPosition(id: string, pos: { x?: number; y?: number; width?: number; height?: number }, isAdmin: boolean = false) {
  if (!isAdmin) return; // Visitor changes are not persisted

  const existing = { x: 100, y: 80, width: 900, height: 600 };
  const updated: WindowPosition = {
    x: pos.x ?? existing.x,
    y: pos.y ?? existing.y,
    width: pos.width ?? existing.width,
    height: pos.height ?? existing.height
  };
  
  const current = loadPositions();
  savePositions({
    windows: {
      ...current.windows,
      [id]: updated
    }
  });
}

// Save single icon position
export function saveIconPosition(id: string, pos: { x: number; y: number }, isAdmin: boolean = false) {
  if (isAdmin) {
    const current = loadPositions();
    savePositions({
      icons: {
        ...current.icons,
        [id]: pos
      }
    });
  }
  // Visitor: no persistence to follow "refresh = reset" rule
}

// Save single note position (for visitor session)
export function saveNotePosition(id: string, pos: { x?: number; y?: number; width?: number; height?: number }, isAdmin: boolean = false) {
  const existing = { x: 100, y: 100, width: 280, height: 280 };
  
  const updated: NotePosition = {
    x: pos.x ?? existing.x,
    y: pos.y ?? existing.y,
    width: pos.width ?? existing.width,
    height: pos.height ?? existing.height
  };
  
  if (isAdmin) {
    const current = loadPositions();
    savePositions({
      notes: {
        ...current.notes,
        [id]: updated
      }
    });
  } else {
    const current = loadSessionPositions();
    saveSessionPositions({
      notes: {
        ...current.notes,
        [id]: updated
      }
    });
  }
}

// Flush semua ke server (admin)
export async function flushPositions(csrfToken: string): Promise<boolean> {
  try {
    const positions = loadPositions();
    
    const payload = {
      windowPreferences: positions.windows || {},
      desktopPreferences: {
        iconPositions: positions.icons || {}
      }
    };
    
    const res = await fetch('/api/about', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    return res.ok;
  } catch {
    return false;
  }
}
