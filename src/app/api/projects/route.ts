import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { ProjectsData, CreateProjectData, Project } from '@/types/projects';
import { checkAdminAuth } from '@/lib/auth';
import projectsData from '@/data/projects.json';
import { githubService } from '@/lib/github';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'projects.json');

// GET - Read all projects
export async function GET(request: NextRequest) {
  try {
    let data: ProjectsData | null = null;
    const isDev = process.env.NODE_ENV === 'development';

    // 1. Development: Try to read from FS
    if (isDev) {
      await ensureDataDir();
      data = (await loadData(DATA_FILE)) as ProjectsData | null;
    }
    // 2. Production: Try to read from GitHub (for freshest data)
    else {
      try {
        const ghData = await githubService.getFile();
        if (ghData && ghData.content) {
          data = ghData.content as ProjectsData;
        }
      } catch (error) {
        console.warn('Failed to fetch from GitHub, falling back to static data:', error);
      }
    }

    // 3. Fallback: Use the statically imported JSON
    if (!data) {
      data = projectsData as unknown as ProjectsData;
    }

    if (!data) {
      return NextResponse.json({
        projects: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    // Filter by status if query param provided
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let projects = data.projects || [];
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
    // Final fallback to avoiding 500
    const fallbackData = projectsData as unknown as ProjectsData;
    return NextResponse.json({
      projects: fallbackData?.projects || [],
      lastUpdated: fallbackData?.lastUpdated || new Date().toISOString()
    });
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

    const isDev = process.env.NODE_ENV === 'development';
    let currentProjects: Project[] = [];

    // FETCH EXISTING DATA
    if (isDev) {
      await ensureDataDir();
      const localData = (await loadData(DATA_FILE)) as ProjectsData | null;
      currentProjects = localData?.projects || [];
    } else {
      try {
        const ghData = await githubService.getFile();
        currentProjects = ghData.content.projects || [];
      } catch (error) {
        console.error('Error fetching current data from GitHub:', error);
        return NextResponse.json(
          { error: 'Failed to connect to storage (GitHub services)' },
          { status: 502 }
        );
      }
    }

    // First run fallback for dev if file was empty/null
    if (isDev && !currentProjects.length) {
      const staticData = projectsData as unknown as ProjectsData;
      if (staticData?.projects?.length) {
        currentProjects = [...staticData.projects];
      }
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
      order: currentProjects.length + 1,
      status: body.status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to list
    const updatedProjects = [...currentProjects, newProject];
    const updatedData = {
      projects: updatedProjects,
      lastUpdated: new Date().toISOString()
    };

    // SAVE DATA
    if (isDev) {
      // Save local FS
      const success = await saveData(DATA_FILE, updatedData);
      if (!success) throw new Error('Failed to save to local filesystem');
    } else {
      // Save to GitHub
      const success = await githubService.updateProjects({
        projects: updatedProjects,
        message: `Add project: ${newProject.title} (via Admin CMS)`
      });
      if (!success) throw new Error('Failed to save to GitHub');
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
