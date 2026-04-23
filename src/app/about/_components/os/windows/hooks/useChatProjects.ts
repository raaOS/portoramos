import { useState, useEffect, useRef } from 'react';
import type { Project } from '@/types/projects';
import { unwrapApiPayload } from '@/lib/api-client';

export function useChatProjects(initialProjects?: Project[]) {
    const [allProjects, setAllProjects] = useState<Project[]>(initialProjects ?? []);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (initialProjects?.length) {
            setAllProjects(initialProjects);
            return;
        }

        // Only fetch from API once if no initial projects provided
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects');
                if (!res.ok) {
                    throw new Error(`Failed to load projects: ${res.status}`);
                }

                const data = await res.json();
                const unwrapped = unwrapApiPayload(data);
                
                // Flexible unwrap: handle { projects: [...] } or direct [...]
                let projects: Project[] = [];
                if (unwrapped && typeof unwrapped === 'object' && 'projects' in (unwrapped as Record<string, any>)) {
                    projects = (unwrapped as Record<string, any>).projects;
                } else if (Array.isArray(unwrapped)) {
                    projects = unwrapped;
                }
                
                if (Array.isArray(projects)) {
                    setAllProjects(projects);
                }
            } catch {
                console.error('Failed to fetch projects for chat');
            }
        };
        fetchProjects();
    }, [initialProjects]);

    const getProjectById = (id: string) => {
        if (!Array.isArray(allProjects)) return undefined;
        return allProjects.find(p => p.id === id);
    };

    return { allProjects, getProjectById };
}
