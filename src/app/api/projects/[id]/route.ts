import { NextRequest, NextResponse } from 'next/server';
import { UpdateProjectData } from '@/types/projects';
import { checkAdminAuth } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';

// GET - Read single project
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    // Inefficient to load all, but consistent with service pattern
    const { projects } = await projectService.getProjects();
    const project = projects.find(p => p.id === id);

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

    const updatedProject = await projectService.updateProject(id, body);

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    // Return actual error message for debugging
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    );
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

    const success = await projectService.deleteProject(id);

    if (!success) {
      return NextResponse.json({ error: 'Project not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    );
  }
}
