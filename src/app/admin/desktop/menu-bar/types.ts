export type OpenPopout = 'db' | 'net' | 'settings' | 'watchdog' | 'uploads' | null;

export interface AdminMenuBarProps {
  onLogout: () => Promise<void>;
}
