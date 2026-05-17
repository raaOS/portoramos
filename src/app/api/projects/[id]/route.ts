import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { UpdateProjectData, Project } from '@/types/projects';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { generateGenZComments } from '@/lib/magic';
import { db } from '@/lib/database';
import { sendTelegramAlert } from '@/lib/telegram';
import { UpdateProjectSchema } from '@/lib/validations';

// GET - Read single project
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    // PERF FIX: Fetch langsung by id â€” sebelumnya load SEMUA project
    // lalu .find() yang inefficient buat banyak project.
    const snap = await db.ref(`projects/${id}`).once('value');
    let project: Project | null = snap.val();

    if (!project) {
      const { projects } = await projectService.getProjects();
      project = projects.find(p => p.id === id) ?? null;
    }

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
    const rawBody = await request.json();

    // Validate with Zod schema (safeParse for user-friendly errors)
    const validationResult = UpdateProjectSchema.safeParse({ ...rawBody, id });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation Failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { id: _validatedId, ...updateData } = validationResult.data;

    // 1. Update Project
    const updatedProject = await projectService.updateProject(id, updateData as UpdateProjectData & { initialCommentCount?: number });

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found or update failed' }, { status: 404 });
    }

    if (rawBody.initialCommentCount && rawBody.initialCommentCount > 0) {
      try {
        console.log(`Generating ${rawBody.initialCommentCount} additional comments for ${updatedProject.slug}...`);
        const newComments = generateGenZComments(updatedProject.slug, rawBody.initialCommentCount);

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
    const changedFields = Object.keys(rawBody).filter(k => k !== 'initialCommentCount').join(', ');
    const updateMessage = `âœï¸ **PROJECT UPDATED**\n\n**Title:** ${updatedProject.title}\n**ID:** ${updatedProject.id}\n**Changes:** ${changedFields || 'No specific fields'}\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(updateMessage).catch(err => console.error('[Telegram] Failed to send update alert:', err));

    revalidatePath('/', 'layout');
    revalidatePath('/projects');
    revalidatePath(`/projects/${updatedProject.slug}`);
    revalidatePath('/admin');

    return NextResponse.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
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

    const successMessage = `ðŸ—‘ï¸ **PROJECT DELETED**\n\n**ID:** ${id}\n**By:** Admin\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(successMessage).catch(err => console.error('[Telegram] Failed to send delete alert:', err));

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

