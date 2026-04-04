"use client"
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
  onToggleItemActive
}: GalleryGroupProps) {
  return (
    <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 bg-white rounded-lg border border-gray-100 shadow-sm">
            <Type size={14} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={group.name}
            onChange={(e) => onUpdateName(group.id, e.target.value)}
            placeholder="Nama Grup (e.g. Logo Concepts)"
            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-900 w-full p-0"
          />
        </div>
        
        <button
          type="button"
          onClick={() => onRemove(group.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Hapus Grup"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
          className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-white transition-all text-gray-400 group"
        >
          <div className="p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
            <Plus size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Add Item</span>
        </button>
      </div>
    </div>
  );
}
