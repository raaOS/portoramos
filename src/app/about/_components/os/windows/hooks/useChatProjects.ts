import { useState, useEffect, useRef } from 'react';
import type { Project } from '@/types/projects';
import { unwrapApiPayload } from '@/lib/api-client';

export function useChatProjects(initialProjects?: Project[]) {
    const [allProjects, setAllProjects] = useState<Project[]>(initialProjects ?? []);
    const hasFetchedRef = useRef(false);

    // Sync initial projects during render for purity
    const [prevInitial, setPrevInitial] = useState(initialProjects);
    if (initialProjects !== prevInitial) {
        setPrevInitial(initialProjects);
        if (initialProjects?.length) {
            setAllProjects(initialProjects);
        }
    }

    useEffect(() => {
        if (allProjects.length > 0) return;

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
                if (unwrapped && typeof unwrapped === 'object' && 'projects' in (unwrapped as Record<string, unknown>)) {
                    projects = (unwrapped as Record<string, unknown>).projects as Project[];
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
    }, [allProjects.length]);

    const getProjectById = (id: string) => {
        if (!Array.isArray(allProjects)) return undefined;
        return allProjects.find(p => p.id === id);
    };

    return { allProjects, getProjectById };
}
