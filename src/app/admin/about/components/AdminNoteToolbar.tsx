import React from 'react';
import { Bold, Italic, List, ListOrdered, CheckSquare, Minus, Plus } from 'lucide-react';

interface AdminNoteToolbarProps {
    onFormat: (command: string, value?: string) => void;
    onInsertChecklist: () => void;
    fontSize: number;
    onFontSizeChange: (newSize: number) => void;
}

export const AdminNoteToolbar = ({ onFormat, onInsertChecklist, fontSize, onFontSizeChange }: AdminNoteToolbarProps) => (
    <div
        className="flex items-center gap-1 mb-2 p-1 bg-gray-100 rounded-md self-start flex-wrap border border-gray-200"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
    >
        <button onClick={() => onFormat('bold')} className="p-1 hover:text-black text-gray-500 transition-colors" title="Bold">
            <Bold size={16} />
        </button>
        <button onClick={() => onFormat('italic')} className="p-1 hover:text-black text-gray-500 transition-colors" title="Italic">
            <Italic size={16} />
        </button>
        <button onClick={() => onFormat('insertUnorderedList')} className="p-1 hover:text-black text-gray-500 transition-colors" title="Bulleted List">
            <List size={16} />
        </button>
        <button onClick={() => onFormat('insertOrderedList')} className="p-1 hover:text-black text-gray-500 transition-colors" title="Numbered List">
            <ListOrdered size={16} />
        </button>
        <button onClick={onInsertChecklist} className="p-1 hover:text-black text-gray-500 transition-colors" title="Checklist">
            <CheckSquare size={16} />
        </button>
        <div className="w-[1px] h-4 bg-gray-300 mx-1" />
        <button onClick={() => onFormat('formatBlock', 'P')} className="p-1 hover:text-black text-gray-500 transition-colors text-xs font-bold w-6 text-center" title="Paragraph">
            P
        </button>
        <button onClick={() => onFormat('formatBlock', 'H1')} className="p-1 hover:text-black text-gray-500 transition-colors text-xs font-bold w-6 text-center" title="Heading 1">
            H1
        </button>
        <div className="w-[1px] h-4 bg-gray-300 mx-1" />
        <div className="flex items-center bg-white border border-gray-200 rounded px-1 gap-1">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onFontSizeChange(Math.max(10, fontSize - 2));
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
                title="Decrease font size"
            >
                <Minus size={14} />
            </button>
            <span className="text-xs font-bold text-gray-600 w-6 text-center select-none">
                {fontSize}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onFontSizeChange(Math.min(72, fontSize + 2));
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
                title="Increase font size"
            >
                <Plus size={14} />
            </button>
        </div>
    </div>
);
