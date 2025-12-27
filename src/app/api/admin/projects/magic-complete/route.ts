import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { generateViralMetrics, generateGenZComments } from '@/lib/magic';

const projectsFile = path.join(process.cwd(), 'src/data/projects.json');
const commentsFile = path.join(process.cwd(), 'src/data/comments.json');

export async function POST(req: Request) {
    try {
        const { projectId, slug } = await req.json();

        if (!projectId || !slug) {
            return NextResponse.json({ error: 'Missing projectId or slug' }, { status: 400 });
        }

        // 1. Update Project Metrics in projects.json
        const projectsData = JSON.parse(readFileSync(projectsFile, 'utf8'));
        const projectIndex = projectsData.projects.findIndex((p: any) => p.id === projectId);

        if (projectIndex === -1) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const metrics = generateViralMetrics();
        projectsData.projects[projectIndex] = {
            ...projectsData.projects[projectIndex],
            ...metrics
        };
        writeFileSync(projectsFile, JSON.stringify(projectsData, null, 2));

        // 2. Generate and Update Comments in comments.json
        const commentsData = JSON.parse(readFileSync(commentsFile, 'utf8'));
        const newComments = generateGenZComments(slug);

        commentsData.comments[slug] = newComments;
        writeFileSync(commentsFile, JSON.stringify(commentsData, null, 2));

        return NextResponse.json({
            success: true,
            metrics,
            commentCount: newComments.length
        });

    } catch (e: any) {
        console.error('Magic Complete Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
