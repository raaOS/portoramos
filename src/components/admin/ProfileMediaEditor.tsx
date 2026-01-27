'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileMediaEditorProps {
    initialUrl?: string;
    initialType?: 'image' | 'video';
    initialScale?: number;
    initialX?: number;
    initialY?: number;
    onSave: (data: { url: string; type: 'image' | 'video'; scale: number; x: number; y: number }) => void;
}

export default function ProfileMediaEditor({
    initialUrl,
    initialType = 'image',
    initialScale = 1,
    initialX = 0,
    initialY = 0,
    onSave
}: ProfileMediaEditorProps) {
    const [url, setUrl] = useState(initialUrl || '');
    const [type, setType] = useState<'image' | 'video'>(initialType);
    const [scale, setScale] = useState(initialScale);
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload to your existing GitHub upload API
            // Using a specific folder for profile pictures
            const response = await fetch('/api/upload/github?folder=assets/profile', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUrl(data.url);
                setType(file.type.startsWith('video/') ? 'video' : 'image');
                setIsEditing(true);
                // Reset transform for new image
                setScale(1);
                setPosition({ x: 0, y: 0 });
            } else {
                alert('Upload failed');
            }
        } catch (err) {
            console.error('Upload Error:', err);
            alert('Upload error');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        onSave({
            url,
            type,
            scale,
            x: position.x,
            y: position.y
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                {/* Preview Circle */}
                <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center group">
                    {url ? (
                        <div className="w-full h-full relative cursor-pointer" onClick={() => setIsEditing(true)}>
                            {type === 'video' ? (
                                <video
                                    src={url}
                                    className="w-full h-full object-cover"
                                    style={{ transform: `scale(${scale}) translate(${position.x}%, ${position.y}%)` }}
                                    muted
                                    loop
                                    autoPlay
                                />
                            ) : (
                                <img
                                    src={url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    style={{ transform: `scale(${scale}) translate(${position.x}%, ${position.y}%)` }}
                                />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-[10px] font-medium">Edit Angle</span>
                            </div>
                        </div>
                    ) : (
                        <Upload className="text-gray-400" size={24} />
                    )}
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo/Video</label>
                    <div className="flex gap-2">
                        <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 flex items-center gap-2">
                            <Upload size={14} />
                            {uploading ? 'Uploading...' : 'Upload New'}
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                        {url && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-100 border border-blue-100"
                            >
                                Adjust Angle
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Recommended: 1:1 ratio. Max 5MB for video.</p>
                </div>
            </div>

            {/* Editor Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Adjust Profile Media</h3>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsEditing(false);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-8 bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
                            {/* The "WhatsApp Style" Cropper */}
                            <div
                                ref={containerRef}
                                className="relative w-72 h-72 rounded-full overflow-hidden border-2 border-white/30 shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-slate-800"
                            >
                                <motion.div
                                    drag
                                    dragMomentum={false}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onDrag={(e, info) => {
                                        // 288 is the pixel width of w-72 (18rem)
                                        const containerSize = 288;
                                        setPosition(prev => ({
                                            x: prev.x + (info.delta.x / (scale * containerSize / 100)),
                                            y: prev.y + (info.delta.y / (scale * containerSize / 100))
                                        }));
                                    }}
                                    className="w-full h-full flex items-center justify-center cursor-move"
                                >
                                    {type === 'video' ? (
                                        <video
                                            src={url}
                                            className="min-w-full min-h-full pointer-events-none"
                                            style={{
                                                transform: `scale(${scale}) translate(${position.x}%, ${position.y}%)`,
                                                objectFit: 'cover'
                                            }}
                                            muted
                                            autoPlay
                                            loop
                                        />
                                    ) : (
                                        <img
                                            src={url}
                                            alt="Editor"
                                            className="min-w-full min-h-full pointer-events-none"
                                            style={{
                                                transform: `scale(${scale}) translate(${position.x}%, ${position.y}%)`,
                                                objectFit: 'cover'
                                            }}
                                        />
                                    )}
                                </motion.div>

                                {/* Center Target UI */}
                                <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none rounded-full" />
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/20 pointer-events-none" />
                                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-white/20 pointer-events-none" />
                            </div>

                            <p className="text-white/40 text-[10px] mt-6 flex items-center gap-1">
                                <Move size={10} /> Drag to reposition
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <ZoomOut size={16} className="text-gray-400" />
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <ZoomIn size={16} className="text-gray-400" />
                            </div>

                            <div className="flex justify-end gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSave();
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    Save Profile Image
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
