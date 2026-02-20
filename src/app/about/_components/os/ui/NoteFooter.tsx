import React from 'react';
import { Star, Trash2, Edit, Pin, Eye, EyeOff, Download, RotateCcw } from 'lucide-react';

interface NoteFooterProps {
    isAdmin: boolean;
    isDeleted: boolean;
    isEditing: boolean;
    isPinned: boolean;
    isStarred: boolean;
    opacity: number;
    onEditToggle: () => void;
    onPinToggle: () => void;
    onOpacityToggle: () => void;
    onStarToggle: () => void;
    onDelete: () => void;
    onRestore: () => void;
    onPermanentDelete: () => void;
    onDownload: () => void;
}

export const NoteFooter = ({
    isAdmin,
    isDeleted,
    isEditing,
    isPinned,
    isStarred,
    opacity,
    onEditToggle,
    onPinToggle,
    onOpacityToggle,
    onStarToggle,
    onDelete,
    onRestore,
    onPermanentDelete,
    onDownload
}: NoteFooterProps) => (
    <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 ml-auto">
            {!isDeleted ? (
                <>
                    {isAdmin && (
                        <button
                            onClick={onEditToggle}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isEditing ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600'}`}
                            title="Edit Note"
                            style={{ minWidth: '36px', minHeight: '36px' }}
                        >
                            <Edit size={18} />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={onPinToggle}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isPinned ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'}`}
                            title={isPinned ? "Unlock Position" : "Lock Position (Pin)"}
                            style={{ minWidth: '36px', minHeight: '36px' }}
                        >
                            <Pin size={18} className={isPinned ? "fill-current" : ""} />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={onOpacityToggle}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors text-gray-700 hover:text-purple-600`}
                            title="Toggle Transparency"
                            style={{ minWidth: '36px', minHeight: '36px' }}
                        >
                            {opacity < 1 ? (
                                <EyeOff size={18} className="text-purple-600" />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={onStarToggle}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isStarred ? 'text-black' : 'text-gray-700 hover:text-yellow-600'}`}
                            title="Star Note"
                            style={{ minWidth: '36px', minHeight: '36px' }}
                        >
                            <Star size={18} fill={isStarred ? "currentColor" : "none"} />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={onDelete}
                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 transition-colors hover:text-red-600"
                            title="Delete Note"
                            style={{ minWidth: '36px', minHeight: '36px' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    <button
                        onClick={onDownload}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 transition-colors hover:text-blue-600"
                        title="Download as PNG"
                        style={{ minWidth: '36px', minHeight: '36px' }}
                    >
                        <Download size={18} />
                    </button>
                </>
            ) : (
                isAdmin && (
                    <>
                        <button
                            onClick={onRestore}
                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:text-green-600 transition-colors"
                            title="Restore Note"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={onPermanentDelete}
                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:text-red-600 transition-colors"
                            title="Delete Permanently"
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                )
            )}
        </div>
    </div>
);
