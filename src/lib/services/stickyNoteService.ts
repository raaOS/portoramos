import { ContentService } from './contentService';
import { NoteData } from '@/app/about/_components/os/StickyNoteItem';
import fallbackNotes from '@/data/sticky-notes.json';

const service = new ContentService<NoteData[]>('sticky-notes.json', fallbackNotes as NoteData[]);

export const stickyNoteService = {
    async getNotes() {
        return await service.getData();
    },

    async updateNotes(notes: NoteData[]) {
        await service.saveData(notes, 'Update sticky notes data');
        return notes;
    }
};
