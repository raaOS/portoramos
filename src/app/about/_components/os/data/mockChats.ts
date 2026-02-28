export interface ChatMessage {
    id: number;
    text: string;
    isMe: boolean;
    time: string;
    status: 'sent' | 'read';
    type?: 'text' | 'image' | 'project';
    imageSrc?: string;
    projectId?: string;
}

export interface ContactProfile {
    id: string;
    name: string;
    avatar: string;
    status: string;
    conversation: ChatMessage[];
}

// mockChats is now empty to ensure CRUD data is the sole source of truth 
// for WhatsApp interactions. Sari, Dodi, and others have been moved to testimonial.json
export const mockChats: Record<string, ContactProfile> = {};
