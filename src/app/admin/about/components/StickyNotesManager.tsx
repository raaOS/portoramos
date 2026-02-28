import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Pin, Star, CheckSquare } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { NoteData } from '@/app/about/_components/os/ui/elements/StickyNoteItem';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminNoteEditor } from './AdminNoteEditor';

const COLORS = [
    '#fef08a', // Yellow
    '#bfdbfe', // Blue
    '#bbf7d0', // Green
    '#fbcfe8', // Pink
    '#f5f5f4', // White
    '#ddd6fe', // Purple
];

interface StickyNotesManagerProps {
    // This prop is optional - component self-manages state
    onUpdate?: (_data: unknown) => void;
}

export default function StickyNotesManager({ }: StickyNotesManagerProps) {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useToast();
    const [saving, setSaving] = useState(false);
    const { csrfToken } = useAdminAuth();

    const loadNotes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/sticky-notes');
            const data = await response.json();
            // Data might be array directly or { notes: [] } depending on API. 
            // Checking route.ts line 8: return NextResponse.json(data); 
            // Assuming service.getNotes() returns the array.
            setNotes(Array.isArray(data) ? data : []);
        } catch {
            showError('Gagal memuat catatan tempel.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/sticky-notes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(notes)
            });

            if (response.ok) {
                showSuccess('Catatan tempel berhasil disimpan.');
            } else {
                showError('Gagal menyimpan catatan.');
            }
        } catch {
            showError('Gagal menyimpan catatan.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = () => {
        const newNote: NoteData = {
            id: crypto.randomUUID(),
            text: 'Catatan Baru',
            date: new Date().toISOString(),
            color: COLORS[0],
            isStarred: false,
            isDeleted: false,
            x: 100 + (notes.length * 20), // Cascade position
            y: 100 + (notes.length * 20),
            width: 280,
            height: 280,
            zIndex: 100,
            fontFamily: 'var(--font-handwritten, "Comic Sans MS", cursive)',
            fontSize: 24,
            isPinned: false
        };
        setNotes([...notes, newNote]);
    };

    const updateNote = (id: string, updates: Partial<NoteData>) => {
        setNotes(notes.map(note => note.id === id ? { ...note, ...updates } : note));
    };

    const deleteNote = (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat catatan...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" /> Kelola Catatan Tempel
                    </h3>
                    <p className="text-sm text-blue-600 mt-1">
                        Buat, edit, atau hapus catatan tempel yang muncul di desktop OS.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={handleAddNote}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} /> Tambah Catatan
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                {notes.map((note) => (
                    <div key={note.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                        {/* Header color strip */}
                        <div
                            className="h-3 w-full"
                            style={{ backgroundColor: note.color }}
                        />

                        <div className="p-4 flex-1 flex flex-col space-y-4">
                            {/* Controls */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-1">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => updateNote(note.id, { color: c })}
                                            className={`w-5 h-5 rounded-full border border-gray-200 transition-transform hover:scale-110 ${note.color === c ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                            style={{ backgroundColor: c }}
                                            title="Atur Warna"
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                                        className={`p-1.5 rounded-md transition-colors ${note.isPinned ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                        title="Sematkan Catatan"
                                    >
                                        <Pin size={14} className={note.isPinned ? "fill-current" : ""} />
                                    </button>
                                    <button
                                        onClick={() => updateNote(note.id, { isStarred: !note.isStarred })}
                                        className={`p-1.5 rounded-md transition-colors ${note.isStarred ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                        title="Bintang"
                                    >
                                        <Star size={14} className={note.isStarred ? "fill-current" : ""} />
                                    </button>
                                </div>
                            </div>

                            {/* Content Editor */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content (HTML Supported)</label>
                                <AdminNoteEditor
                                    value={note.text}
                                    onChange={(val) => updateNote(note.id, { text: val })}
                                    fontSize={note.fontSize || 18}
                                    onFontSizeChange={(size) => updateNote(note.id, { fontSize: size })}
                                />
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
                                    ID: {note.id.slice(0, 8)}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        <span title="X Position">x: {Math.round(note.x || 0)}</span>
                                        <span title="Y Position">y: {Math.round(note.y || 0)}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-gray-500 font-medium">Tidak ada catatan tempel ditemukan</h3>
                        <p className="text-gray-400 text-sm mt-1">Klik &quot;Tambah Catatan&quot; untuk membuat yang pertama.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
