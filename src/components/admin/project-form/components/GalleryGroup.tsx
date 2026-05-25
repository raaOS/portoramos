'use client';
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
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="rounded-lg border border-gray-100 bg-white p-1.5 shadow-sm">
            <Type size={14} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={group.name}
            onChange={(e) => onUpdateName(group.id, e.target.value)}
            placeholder="Nama Grup (e.g. Logo Concepts)"
            className="w-full border-none bg-transparent p-0 text-sm font-semibold text-gray-900 focus:ring-0"
          />
        </div>

        <button
          type="button"
          onClick={() => onRemove(group.id)}
          className="p-1.5 text-gray-400 transition-colors hover:text-red-500"
          title="Hapus Grup"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
          className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-all hover:border-gray-300 hover:bg-white"
        >
          <div className="rounded-full bg-gray-100 p-2 transition-colors group-hover:bg-gray-200">
            <Plus size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Add Item</span>
        </button>
      </div>
    </div>
  );
}
