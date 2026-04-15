import { useState, useEffect } from 'react';
import type { Project } from '@/types/projects';

export function useChatProjects() {
    const [allProjects, setAllProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects');
                const data = await res.json();
                if (data.success && Array.isArray(data.projects)) {
                    setAllProjects(data.projects);
                }
            } catch (err) {
                console.error('Failed to fetch projects for chat:', err);
            }
        };
        fetchProjects();
    }, []);

    const getProjectById = (id: string) => {
        if (!Array.isArray(allProjects)) return undefined;
        return allProjects.find(p => p.id === id);
    };

    return { allProjects, getProjectById };
}
