import { ContentService } from './contentService';
import { NoteData } from '@/app/about/_components/os/StickyNoteItem';

const FALLBACK_NOTES: NoteData[] = [
    {
        id: '1',
        text: 'Welcome to Sticky Notes! 📝\n\nClick the + button to add a new note.',
        date: new Date().toISOString(),
        color: '#fef08a',
        isStarred: false,
        isDeleted: false
    },
    {
        id: '2',
        text: 'Try changing my color or starring me! ⭐',
        date: new Date().toISOString(),
        color: '#bfdbfe',
        isStarred: true,
        isDeleted: false
    },
];

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
