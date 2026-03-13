// Sistem positions yang simple dan reliable
// localStorage = primary source for ADMIN ONLY, Firebase = template for visitors

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
export function saveSessionPositions(data: Partial<PositionData>) {
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
  firebaseData: any, 
  defaults: { x: number; y: number; width: number; height: number },
  isAdmin: boolean = false
): { x: number; y: number; width: number; height: number } {
  // 1. Cek localStorage hanya jika admin (sebagai buffer sesi)
  if (isAdmin) {
    const local = loadPositions().windows?.[id];
    if (local) return local;
  }
  
  // 2. Cek Firebase (Sumber utama untuk visitor)
  if (firebaseData?.x !== undefined) {
    return {
      x: firebaseData.x,
      y: firebaseData.y,
      width: firebaseData.width || defaults.width,
      height: firebaseData.height || defaults.height
    };
  }
  
  // 3. Default
  return defaults;
}

// Get position icon
export function getIconPosition(
  id: string,
  firebaseData: any,
  defaults: { x: number; y: number },
  isAdmin: boolean = false
): { x: number; y: number } {
  // 1. Cek localStorage hanya jika admin
  if (isAdmin) {
    const local = loadPositions().icons?.[id];
    if (local) return local;
  }
  
  if (firebaseData?.x !== undefined) {
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
