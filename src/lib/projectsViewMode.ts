/**
 * Helper untuk track mode tampilan terakhir di /projects (grid atau 3D canvas).
 *
 * Dipakai oleh:
 * - ProjectsFinderHeader: menyimpan mode aktif setiap kali user berpindah mode
 * - ProjectBackButton (di project detail): baca mode terakhir biar tombol
 *   "Back to Projects" balik ke mode yang sama dengan yang user pakai sebelumnya.
 *
 * sessionStorage dipilih (bukan localStorage) agar state hanya persist selama
 * tab session — buka tab baru = mulai dari grid (default).
 */

const STORAGE_KEY = 'portfolio:lastProjectsView';

export type ProjectsViewMode = 'grid' | '3d';

const DEFAULT_MODE: ProjectsViewMode = 'grid';

export function saveProjectsViewMode(view: ProjectsViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, view);
  } catch {
    // sessionStorage bisa throw di private mode Safari, aman untuk di-ignore
  }
}

export function readProjectsViewMode(): ProjectsViewMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw === '3d' ? '3d' : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/** Bangun URL /projects?view=... dari mode yang diberikan */
export function buildProjectsHref(view: ProjectsViewMode): string {
  return view === '3d' ? '/projects?view=3d' : '/projects';
}
