import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Pin, Star, CheckSquare } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { NoteData } from '@/components/os/ui/elements/StickyNoteItem';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminNoteEditor } from './AdminNoteEditor';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminStickyNotes,
} from '../../lib/adminQueries';

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

export default function StickyNotesManager({}: StickyNotesManagerProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const { csrfToken } = useAdminAuth();
  const { confirm } = useConfirm();

  const notesQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.stickyNotes,
    queryFn: fetchAdminStickyNotes,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.stickyNotes,
  });

  const [prevNotesData, setPrevNotesData] = useState<typeof notesQuery.data>(undefined);
  if (notesQuery.data && notesQuery.data !== prevNotesData) {
    setPrevNotesData(notesQuery.data);
    setNotes(notesQuery.data);
  }

  useEffect(() => {
    if (notesQuery.error) {
      showError('Gagal memuat catatan tempel.');
    }
  }, [notesQuery.error, showError]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/sticky-notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(notes),
      });

      if (response.ok) {
        queryClient.setQueryData(ADMIN_QUERY_KEYS.stickyNotes, notes);
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
      x: 100 + notes.length * 20, // Cascade position
      y: 100 + notes.length * 20,
      width: 280,
      height: 280,
      zIndex: 100,
      fontFamily: 'var(--font-handwritten, "Comic Sans MS", "Chalkboard SE", cursive)',
      fontSize: 18,
      isPinned: false,
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, updates: Partial<NoteData>) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, ...updates } : note)));
  };

  const deleteNote = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus catatan?',
      message: 'Catatan tempel ini akan dihapus dari daftar.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (ok) {
      setNotes(notes.filter((n) => n.id !== id));
    }
  };

  if (notesQuery.isLoading)
    return <div className="p-8 text-center text-gray-500">Memuat catatan...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-blue-800">
            <CheckSquare className="h-5 w-5" /> Kelola Catatan Tempel
          </h3>
          <p className="mt-1 text-sm text-blue-600">
            Buat, edit, atau hapus catatan tempel yang muncul di desktop OS.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleAddNote}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            <Plus size={16} /> Tambah Catatan
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Header color strip */}
            <div className="h-3 w-full" style={{ backgroundColor: note.color }} />

            <div className="flex flex-1 flex-col space-y-4 p-4">
              {/* Controls */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateNote(note.id, { color: c })}
                      className={`h-5 w-5 rounded-full border border-gray-200 transition-transform hover:scale-110 ${note.color === c ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                      style={{ backgroundColor: c }}
                      title="Atur Warna"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                    className={`rounded-md p-1.5 transition-colors ${note.isPinned ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Sematkan Catatan"
                  >
                    <Pin size={14} className={note.isPinned ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={() => updateNote(note.id, { isStarred: !note.isStarred })}
                    className={`rounded-md p-1.5 transition-colors ${note.isStarred ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Bintang"
                  >
                    <Star size={14} className={note.isStarred ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>

              {/* Content Editor */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Content (HTML Supported)
                </label>
                <AdminNoteEditor
                  value={note.text}
                  onChange={(val) => updateNote(note.id, { text: val })}
                  fontSize={note.fontSize || 18}
                  onFontSizeChange={(size) => updateNote(note.id, { fontSize: size })}
                />
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between pt-2">
                <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-400">
                  ID: {note.id.slice(0, 8)}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    <span title="X Position">x: {Math.round(note.x || 0)}</span>
                    <span title="Y Position">y: {Math.round(note.y || 0)}</span>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
            <CheckSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <h3 className="font-medium text-gray-500">Tidak ada catatan tempel ditemukan</h3>
            <p className="mt-1 text-sm text-gray-400">
              Klik &quot;Tambah Catatan&quot; untuk membuat yang pertama.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
