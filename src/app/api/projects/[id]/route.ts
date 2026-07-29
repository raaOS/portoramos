import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { UpdateProjectData, Project } from '@/types/projects';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { generateAiCommentsWithFallback } from '@/app/api/admin/projects/magic-complete/route';
import { db } from '@/lib/database';
import { sendTelegramAlert } from '@/lib/telegram';
import { commentSchema, UpdateProjectSchema } from '@/lib/validations';

const submittedCommentsSchema = commentSchema.array().max(1000, 'Too many comments');

async function moveCommentsWhenSlugChanges(previousSlug?: string, nextSlug?: string) {
  if (!previousSlug || !nextSlug || previousSlug === nextSlug) return;

  try {
    const previousRef = db.ref(`comments/${previousSlug}`);
    const nextRef = db.ref(`comments/${nextSlug}`);
    const [previousSnap, nextSnap] = await Promise.all([
      previousRef.once('value'),
      nextRef.once('value'),
    ]);

    const previousComments = previousSnap.val();
    if (!Array.isArray(previousComments) || previousComments.length === 0) return;

    const nextComments = nextSnap.val();
    const mergedComments = Array.isArray(nextComments)
      ? [...nextComments, ...previousComments]
      : previousComments;

    await nextRef.set(mergedComments);
    await previousRef.remove();
  } catch (error) {
    console.error('[API/Projects/[id]] Failed to migrate comments after slug change:', error);
  }
}

// GET - Read single project
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    // PERF FIX: Fetch langsung by id — sebelumnya load SEMUA project
    // lalu .find() yang inefficient buat banyak project.
    const snap = await db.ref(`projects/${id}`).once('value');
    let project: Project | null = snap.val();

    if (!project) {
      const { projects } = await projectService.getProjects();
      project = projects.find((p) => p.id === id) ?? null;
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
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const rawBody = await request.json();
    const submittedCommentsResult = Array.isArray(rawBody.comments)
      ? submittedCommentsSchema.safeParse(rawBody.comments)
      : null;

    if (submittedCommentsResult && !submittedCommentsResult.success) {
      return NextResponse.json(
        { error: 'Invalid comments payload', details: submittedCommentsResult.error.format() },
        { status: 400 }
      );
    }

    // Validate with Zod schema (safeParse for user-friendly errors)
    const validationResult = UpdateProjectSchema.safeParse({ ...rawBody, id });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation Failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { id: _validatedId, ...updateData } = validationResult.data;
    const currentProjectSnap = await db.ref(`projects/${id}`).once('value');
    const currentProject = currentProjectSnap.val() as Project | null;
    const previousSlug = currentProject?.slug;

    // 1. Update Project
    const updatedProject = await projectService.updateProject(
      id,
      updateData as UpdateProjectData & { initialCommentCount?: number }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found or update failed' }, { status: 404 });
    }

    await moveCommentsWhenSlugChanges(previousSlug, updatedProject.slug);

    // Track apakah persistensi komentar sempat gagal, supaya bisa di-bubble ke
    // response tanpa menggagalkan update project (yang sudah sukses di step 1).
    // Sebelumnya: failure ditelan console.error saja → user dapat response 200
    // tapi komentar hilang dari DB diam-diam (Schrödinbug).
    let commentsPersistWarning: string | undefined;

    if (submittedCommentsResult?.success) {
      try {
        await db.ref(`comments/${updatedProject.slug}`).set(submittedCommentsResult.data);
      } catch (commentError) {
        console.error('Failed to persist submitted comments:', commentError);
        commentsPersistWarning =
          'Project saved, but comments failed to persist. Please retry comments.';
      }
    } else if (rawBody.initialCommentCount && rawBody.initialCommentCount > 0) {
      try {
        const newComments = await generateAiCommentsWithFallback({
          slug: updatedProject.slug,
          count: rawBody.initialCommentCount,
          tone: 'casual',
          reply: true,
          projectTitle: updatedProject.title,
          projectDescription: updatedProject.description,
          cover: updatedProject.cover,
          reqUrl: request.url,
        });

        const commentsRef = db.ref(`comments/${updatedProject.slug}`);
        const snap = await commentsRef.once('value');
        const existingComments = snap.val() || [];

        const combinedComments = [
          ...(Array.isArray(existingComments) ? existingComments : []),
          ...newComments,
        ];

        await commentsRef.set(combinedComments);
        console.log(`[API/Projects/[id]] Successfully appended comments to ${updatedProject.slug}`);
      } catch (commentError) {
        console.error('Failed to append comments via Real AI:', commentError);
        commentsPersistWarning = 'Project saved, but generated comments failed to persist.';
      }
    }

    // --- Telegram Notification ---
    const changedFields = Object.keys(rawBody)
      .filter((k) => k !== 'initialCommentCount' && k !== 'comments')
      .join(', ');
    const updateMessage = `✏️ **PROJECT UPDATED**\n\n**Title:** ${updatedProject.title}\n**ID:** ${updatedProject.id}\n**Changes:** ${changedFields || 'No specific fields'}\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(updateMessage).catch((err) =>
      console.error('[Telegram] Failed to send update alert:', err)
    );

    revalidatePath('/', 'layout');
    revalidatePath('/projects');
    if (previousSlug && previousSlug !== updatedProject.slug) {
      revalidatePath(`/projects/${previousSlug}`);
    }
    revalidatePath(`/projects/${updatedProject.slug}`);
    revalidatePath('/admin');

    return NextResponse.json({
      success: true,
      project: updatedProject,
      ...(commentsPersistWarning ? { commentsWarning: commentsPersistWarning } : {}),
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
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const success = await projectService.deleteProject(id);

    if (!success) {
      return NextResponse.json({ error: 'Project not found or delete failed' }, { status: 404 });
    }

    const successMessage = `🗑️ **PROJECT DELETED**\n\n**ID:** ${id}\n**By:** Admin\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(successMessage).catch((err) =>
      console.error('[Telegram] Failed to send delete alert:', err)
    );

    revalidatePath('/', 'layout');
    revalidatePath('/projects');
    revalidatePath('/admin');

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    );
  }
}
