'use client';
/**
 * Gallery Group — Komponen grup gallery dengan judul dan item.
 * @module components/admin/project-form/components/GalleryGroup
 */
import React from 'react';
import { Trash2, Plus, Type } from 'lucide-react';
import GalleryItem from './GalleryItem';
import { GalleryGroup as GalleryGroupType, GalleryItem as GalleryItemType } from '@/types/projects';

interface GalleryGroupProps {
  group: GalleryGroupType;
  index: number;
  onRemove: (groupId: string) => void;
  onUpdateName: (groupId: string, name: string) => void;
  onAddItem: (groupId: string) => void;
  onRemoveItem: (groupId: string, itemIndex: number) => void;
  onToggleItemActive: (groupId: string, itemIndex: number) => void;
}

export default function GalleryGroup({
  group,
  onRemove,
  onUpdateName,
  onAddItem,
  onRemoveItem,
  onToggleItemActive,
}: GalleryGroupProps) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/20 p-3">
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div className="flex flex-1 items-center gap-1.5">
          <Type size={12} className="text-slate-400" />
          <input
            type="text"
            value={group.name}
            onChange={(e) => onUpdateName(group.id, e.target.value)}
            placeholder="Nama Grup (e.g. Logo Concepts)"
            className="w-full border-none bg-transparent p-0 text-xs font-semibold text-slate-800 focus:ring-0 focus:outline-none placeholder-slate-300"
          />
        </div>

        <button
          type="button"
          onClick={() => onRemove(group.id)}
          className="p-1 text-slate-400 transition-colors hover:text-red-500"
          title="Hapus Grup"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {group.items.map((item: GalleryItemType, itemIndex: number) => (
          <GalleryItem
            key={`${group.id}-${itemIndex}`}
            item={item}
            onRemove={() => onRemoveItem(group.id, itemIndex)}
            onToggleActive={() => onToggleItemActive(group.id, itemIndex)}
          />
        ))}

        <button
          type="button"
          onClick={() => onAddItem(group.id)}
          className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded border border-dashed border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-800 hover:text-slate-800"
        >
          <Plus size={16} className="text-slate-400 transition-transform group-hover:scale-110" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-wider">Add Item</span>
        </button>
      </div>
    </div>
  );
}
