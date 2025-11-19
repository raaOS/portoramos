import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { ProjectsData, CreateProjectData, Project } from '@/types/projects';
import { checkAdminAuth } from '@/lib/auth';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'projects.json');

// GET - Read all projects
export async function GET(request: NextRequest) {
  try {
    await ensureDataDir();
    const data = (await loadData(DATA_FILE)) as ProjectsData | null;

    if (!data) {
      return NextResponse.json({
        projects: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    // Filter by status if query param provided
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let projects = data.projects;
    if (status) {
      projects = projects.filter((project) => project.status === status);
    }

    const sortedProjects = projects
      .slice()
      .sort(
        (a, b) =>
          (a.order || 0) - (b.order || 0) ||
          (b.year || 0) - (a.year || 0)
      );

    return NextResponse.json({
      projects: sortedProjects,
      lastUpdated: data.lastUpdated,
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    return NextResponse.json(
      { error: 'Failed to load projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateProjectData = await request.json();

    // Validate required fields
    if (!body.title || !body.client || !body.year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await ensureDataDir();
    let data = (await loadData(DATA_FILE)) as ProjectsData | null;

    // If no data file yet, initialise empty dataset
    if (!data) {
      data = { projects: [], lastUpdated: new Date().toISOString() };
    }

    // Generate new project
    const newProject: Project = {
      ...body,
      id: `project-${Date.now()}`,
      slug: body.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
      cover: body.cover || 'https://via.placeholder.com/800x600',
      autoplay: body.autoplay ?? false,
      muted: body.muted ?? true,
      loop: body.loop ?? false,
      playsInline: body.playsInline ?? true,
      coverWidth: body.coverWidth || 800,
      coverHeight: body.coverHeight || 600,
      gallery: body.gallery || [],
      galleryItems: body.galleryItems || [],
      external_link: body.external_link || '',
      order: data.projects.length + 1,
      status: body.status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to data
    data.projects.push(newProject);
    data.lastUpdated = new Date().toISOString();

    // Save data
    const success = await saveData(DATA_FILE, data);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
