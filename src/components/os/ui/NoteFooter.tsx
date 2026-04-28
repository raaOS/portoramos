import React from 'react';
import { Trash2, Download, RotateCcw } from 'lucide-react';

interface NoteFooterProps {
    isAdmin: boolean;
    isDeleted: boolean;
    isPinned: boolean;
    isStarred: boolean;
    opacity: number;
    onDelete: () => void;
    onRestore: () => void;
    onPermanentDelete: () => void;
    onDownload: () => void;
}

export const NoteFooter = ({
    isAdmin,
    isDeleted,
    onDelete,
    onRestore,
    onPermanentDelete,
    onDownload
}: NoteFooterProps) => (
    <div className="h-10 px-4 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 ml-auto">
            {!isDeleted ? (
                <>

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
