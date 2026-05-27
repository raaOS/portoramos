import React from 'react';
import { Bold, Italic, List, ListOrdered, CheckSquare, Minus, Plus } from 'lucide-react';

interface AdminNoteToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onInsertChecklist: () => void;
  fontSize: number;
  onFontSizeChange: (newSize: number) => void;
}

export const AdminNoteToolbar = ({
  onFormat,
  onInsertChecklist,
  fontSize,
  onFontSizeChange,
}: AdminNoteToolbarProps) => (
  <div
    className="mb-2 flex flex-wrap items-center gap-1 self-start rounded-md border border-gray-200 bg-gray-100 p-1"
    onPointerDown={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
  >
    <button
      onClick={() => onFormat('bold')}
      className="p-1 text-gray-500 transition-colors hover:text-black"
      title="Bold"
    >
      <Bold size={16} />
    </button>
    <button
      onClick={() => onFormat('italic')}
      className="p-1 text-gray-500 transition-colors hover:text-black"
      title="Italic"
    >
      <Italic size={16} />
    </button>
    <button
      onClick={() => onFormat('insertUnorderedList')}
      className="p-1 text-gray-500 transition-colors hover:text-black"
      title="Bulleted List"
    >
      <List size={16} />
    </button>
    <button
      onClick={() => onFormat('insertOrderedList')}
      className="p-1 text-gray-500 transition-colors hover:text-black"
      title="Numbered List"
    >
      <ListOrdered size={16} />
    </button>
    <button
      onClick={onInsertChecklist}
      className="inline-flex items-center justify-center p-1 text-gray-500 transition-colors hover:text-black"
      title="Checklist"
    >
      <CheckSquare size={16} />
    </button>
    <div className="mx-1 h-4 w-[1px] bg-gray-300" />
    <button
      onClick={() => onFormat('formatBlock', 'P')}
      className="w-6 p-1 text-center text-xs font-bold text-gray-500 transition-colors hover:text-black"
      title="Paragraph"
    >
      P
    </button>
    <button
      onClick={() => onFormat('formatBlock', 'H1')}
      className="w-6 p-1 text-center text-xs font-bold text-gray-500 transition-colors hover:text-black"
      title="Heading 1"
    >
      H1
    </button>
    <div className="mx-1 h-4 w-[1px] bg-gray-300" />
    <div className="flex items-center gap-1 rounded border border-gray-200 bg-white px-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFontSizeChange(Math.max(10, fontSize - 2));
        }}
        className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition-colors hover:bg-gray-100"
        title="Decrease font size"
      >
        <Minus size={14} />
      </button>
      <span className="w-6 select-none text-center text-xs font-bold text-gray-600">
        {fontSize}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFontSizeChange(Math.min(72, fontSize + 2));
        }}
        className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition-colors hover:bg-gray-100"
        title="Increase font size"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);
