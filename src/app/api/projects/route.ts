import { NextRequest, NextResponse } from 'next/server';
import { CreateProjectData } from '@/types/projects';
import { checkAdminAuth } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';

// GET - Read all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const fresh = searchParams.get('fresh') === 'true';

    const { projects, lastUpdated } = await projectService.getProjects(status, fresh);

    return NextResponse.json({
      projects,
      lastUpdated,
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

    const newProject = await projectService.createProject(body);

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
