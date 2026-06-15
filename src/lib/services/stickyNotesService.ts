/**
 * Sticky Notes Service — CRUD sticky notes di desktop simulator.
 *
 * @module stickyNotesService
 */
import { ContentService } from './contentService';
import { NoteData } from '@/components/os/ui/elements/StickyNoteItem';
import fallbackNotes from '@/data/sticky-notes.json';

const service = new ContentService<NoteData[]>('sticky-notes.json', fallbackNotes as NoteData[]);

function normalizeNote(note: Partial<NoteData> & { id: string }, index: number): NoteData {
  return {
    id: note.id,
    text: note.text || '',
    date: note.date || new Date().toISOString(),
    color: note.color || '#fef08a',
    isStarred: note.isStarred ?? false,
    isDeleted: note.isDeleted ?? false,
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
    xPct: note.xPct,
    yPct: note.yPct,
    widthPct: note.widthPct,
    heightPct: note.heightPct,
    refScreenWidth: note.refScreenWidth,
    refScreenHeight: note.refScreenHeight,
    isPinned: note.isPinned,
    isCollapsed: note.isCollapsed,
    opacity: note.opacity,
    zIndex: note.zIndex ?? index + 1,
    fontFamily: note.fontFamily,
    fontSize: note.fontSize,
  };
}

export const stickyNotesService = {
  async getNotes(noCache = false) {
    const notes = await service.getData(noCache);
    return Array.isArray(notes) ? notes.map((note, index) => normalizeNote(note, index)) : [];
  },

  async saveNotes(notes: NoteData[]) {
    const normalizedNotes = notes.map((note, index) => normalizeNote(note, index));
    await service.saveData(normalizedNotes, 'Update sticky notes contents');
    return normalizedNotes;
  },
};
