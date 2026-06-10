import React from 'react';
import { DockPreferences } from '@/types/about';
import AppIcon from '../ui/AppIcon';

interface DockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  href?: string;
  isOpen?: boolean;
  popoverContent?: React.ReactNode;
}

/**
 * Merges default dock items with the user's configuration from the database.
 * This ensures that labels and icons can be customized via the Admin Panel,
 * and these changes are reflected consistently across all pages.
 *
 * Tidak ada lagi whitelist debug per-item — semua item menghormati
 * `isHidden` di config sehingga admin panel benar-benar berfungsi.
 */
export const getDockItemConfig = <T extends DockItem>(
  defaultItems: T[],
  config?: DockPreferences
): T[] => {
  if (!config) return defaultItems;

  const defaultIndexMap = new Map(defaultItems.map((item, index) => [item.id, index]));

  return defaultItems
    .filter((item) => !config[item.id]?.isHidden)
    .map((item) => {
      const pref = config[item.id];
      if (!pref) return item;

      const next: T = { ...item };
      if (pref.iconUrl) {
        next.icon = <AppIcon imageUrl={pref.iconUrl} priority />;
      }
      if (pref.label) {
        next.label = pref.label;
      }
      return next;
    })
    .sort((a, b) => {
      const orderA = config[a.id]?.order ?? defaultIndexMap.get(a.id) ?? 1000;
      const orderB = config[b.id]?.order ?? defaultIndexMap.get(b.id) ?? 1000;
      return orderA - orderB;
    });
};
