export interface AboutContent {
    bio: {
        title: string;
        content: string;
    };
    services?: {
        title: string;
        items: Array<{
            title: string;
            description: string;
            icon: string;
        }>;
    };
    skills?: Array<{
        name: string;
        level: number;
    }>;
    experience?: Array<{
        year: string;
        role: string;
        company: string;
        description: string;
    }>;
}

export interface ContactContent {
    title: string;
    content: string;
    email?: string;
    whatsapp?: string;
    instagram?: string;
}
