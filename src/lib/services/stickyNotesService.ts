import { ContentService } from './contentService';
import { NoteData } from '@/components/os/ui/elements/StickyNoteItem';

const FALLBACK_NOTES: NoteData[] = [];


const service = new ContentService<NoteData[]>('sticky-notes.json', FALLBACK_NOTES);

export const stickyNotesService = {
    async getNotes(noCache = false) {
        return await service.getData(noCache);
    },

    async saveNotes(notes: NoteData[]) {
        await service.saveData(notes, 'Update sticky notes contents');
        return notes;
    }
};
