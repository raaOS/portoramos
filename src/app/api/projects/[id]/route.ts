import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { ProjectsData, UpdateProjectData, Project } from '@/types/projects';
import { checkAdminAuth } from '@/lib/auth';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'projects.json');

// GET - Read single project
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    await ensureDataDir();
    const data = await loadData(DATA_FILE) as ProjectsData;

    if (!data) {
      return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
    }

    const project = data.projects.find(p => p.id === id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error loading project:', error);
    return NextResponse.json({ error: 'Failed to load project' }, { status: 500 });
  }
}

// PUT - Update project (admin only)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await props.params;
    const { id } = params;
    const body: UpdateProjectData = await request.json();

    await ensureDataDir();
    const data = await loadData(DATA_FILE) as ProjectsData;

    if (!data) {
      return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
    }

    const projectIndex = data.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update project
    const updatedProject: Project = {
      ...data.projects[projectIndex],
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    data.projects[projectIndex] = updatedProject;
    data.lastUpdated = new Date().toISOString();

    // Save data
    const success = await saveData(DATA_FILE, data);

    if (!success) {
      return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete project (admin only)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await props.params;
    const { id } = params;

    await ensureDataDir();
    const data = await loadData(DATA_FILE) as ProjectsData;

    if (!data) {
      return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
    }

    const projectIndex = data.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Remove project
    data.projects.splice(projectIndex, 1);
    data.lastUpdated = new Date().toISOString();

    // Save data
    const success = await saveData(DATA_FILE, data);

    if (!success) {
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
