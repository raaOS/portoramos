import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { UpdateProjectData } from '@/types/projects';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { generateGenZComments } from '@/lib/magic';
import { db } from '@/lib/firebaseAdmin';
import { sendTelegramAlert } from '@/lib/telegram';

// GET - Read single project
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

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
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json(
        { error: 'Unauthorized or invalid CSRF token' },
        { status: 401 }
      );
    }

    const params = await props.params;
    const { id } = params;
    const body: UpdateProjectData & { initialCommentCount?: number } = await request.json();

    // 1. Update Project
    const updatedProject = await projectService.updateProject(id, body);

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found or update failed' }, { status: 404 });
    }

    // --- Auto-Generate / Append Comments (Firebase) ---
    if (body.initialCommentCount && body.initialCommentCount > 0) {
      try {
        console.log(`Generating ${body.initialCommentCount} additional comments for ${updatedProject.slug}...`);
        const newComments = generateGenZComments(updatedProject.slug, body.initialCommentCount);

        // Get existing comments from Firebase
        const commentsRef = db.ref(`comments/${updatedProject.slug}`);
        const snap = await commentsRef.once('value');
        const existingComments = snap.val() || [];

        const combinedComments = [
          ...(Array.isArray(existingComments) ? existingComments : []),
          ...newComments
        ];

        await commentsRef.set(combinedComments);
        console.log(`[API/Projects/[id]] Successfully appended comments to ${updatedProject.slug}`);
      } catch (commentError) {
        console.error('Failed to append comments:', commentError);
      }
    }

    // --- Telegram Notification ---
    const changedFields = Object.keys(body).filter(k => k !== 'initialCommentCount').join(', ');
    const updateMessage = `✏️ **PROJECT UPDATED**\n\n**Title:** ${updatedProject.title}\n**ID:** ${updatedProject.id}\n**Changes:** ${changedFields || 'No specific fields'}\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(updateMessage);

    revalidatePath('/', 'layout');
    revalidatePath('/projects');
    revalidatePath(`/projects/${updatedProject.slug}`);
    revalidatePath('/admin');

    return NextResponse.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Failed', details: error.format() }, { status: 400 });
    }
    console.error('Error updating project:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete project (admin only)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json(
        { error: 'Unauthorized or invalid CSRF token' },
        { status: 401 }
      );
    }

    const params = await props.params;
    const { id } = params;

    const success = await projectService.deleteProject(id);

    if (!success) {
      return NextResponse.json({ error: 'Project not found or delete failed' }, { status: 404 });
    }

    const successMessage = `🗑️ **PROJECT DELETED**\n\n**ID:** ${id}\n**By:** Admin\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(successMessage);

    revalidatePath('/', 'layout');
    revalidatePath('/projects');
    revalidatePath('/admin');

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
