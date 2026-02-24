import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { UpdateProjectData } from '@/types/projects';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { generateGenZComments } from '@/lib/magic';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';
import fs from 'fs';
import { sendTelegramAlert } from '@/lib/telegram';

const COMMENTS_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'comments.json');
const COMMENTS_GITHUB_PATH = 'src/data/comments.json';

interface CommentsData {
  comments: Record<string, any[]>;
}

// Helper to finalize media (Move from temp to permanent)
async function finalizeMedia(
  url: string,
  slug: string,
  subDir: string = 'projects',
  suffix: string = ''
): Promise<string> {
  if (!url || !url.startsWith('/temp/')) return url;

  try {
    const publicDir = path.join(process.cwd(), 'public');
    const relativeUrl = url.startsWith('/') ? url.slice(1) : url;
    const oldPath = path.join(publicDir, relativeUrl);

    if (!fs.existsSync(oldPath)) return url;

    // Use original extension
    const ext = path.extname(url);
    const newFilename = `${slug}${suffix}${ext}`;

    // Construct target directory
    const targetDir = path.join(publicDir, 'assets', subDir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const newPath = path.join(targetDir, newFilename);

    // Move/Rename
    await fs.promises.rename(oldPath, newPath);

    return `/assets/${subDir}/${newFilename}`;
  } catch (e) {
    console.error('Finalize Media Error:', e);
    return url;
  }
}

// GET - Read single project
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    // TODO: Optimasi - tambahkan getProjectById(id) di projectService agar tidak perlu load semua proyek
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

    // 1. Fetch existing project to get 'slug' for renaming files
    const { projects } = await projectService.getProjects();
    const existingProject = projects.find(p => p.id === id);

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const targetSlug = body.slug || existingProject.slug;

    // 2. Finalize Media (Move from /temp/ to /assets/...)
    // Cover
    if (body.cover && body.cover.startsWith('/temp/')) {
      body.cover = await finalizeMedia(body.cover, targetSlug, 'projects', '');
    }

    // Comparison Images
    if (body.comparison) {
      if (body.comparison.beforeImage && body.comparison.beforeImage.startsWith('/temp/')) {
        body.comparison.beforeImage = await finalizeMedia(
          body.comparison.beforeImage,
          targetSlug,
          'projects/comparisons',
          '-before'
        );
      }
      if (body.comparison.afterImage && body.comparison.afterImage.startsWith('/temp/')) {
        body.comparison.afterImage = await finalizeMedia(
          body.comparison.afterImage,
          targetSlug,
          'projects',
          '-after'
        );
      }
    }

    // 3. Update Project with finalized paths
    const updatedProject = await projectService.updateProject(id, body);

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found or update failed' }, { status: 404 });
    }

    // --- Auto-Generate / Append Comments if requested ---
    if (body.initialCommentCount && body.initialCommentCount > 0) {
      try {
        console.log(`Generating ${body.initialCommentCount} additional comments for ${updatedProject.slug}...`);
        const newComments = generateGenZComments(updatedProject.slug, body.initialCommentCount);

        const isDev = process.env.NODE_ENV === 'development';
        let commentsData: CommentsData = { comments: {} };

        // Load existing data
        if (isDev) {
          await ensureDataDir();
          const loaded = await loadData(COMMENTS_DATA_FILE);
          if (loaded) commentsData = loaded as CommentsData;
        } else {
          try {
            const gh = await githubService.getFileContent<CommentsData>(COMMENTS_GITHUB_PATH);
            commentsData = gh.content;
          } catch (e) {
            console.warn('Failed to load GitHub comments, starting fresh', e);
          }
        }

        // Ensure structure
        if (!commentsData.comments) commentsData.comments = {};
        if (!commentsData.comments[updatedProject.slug]) commentsData.comments[updatedProject.slug] = [];

        // Append new comments
        commentsData.comments[updatedProject.slug] = [
          ...commentsData.comments[updatedProject.slug],
          ...newComments
        ];

        // Save data
        if (isDev) {
          await saveData(COMMENTS_DATA_FILE, commentsData);
        } else {
          await githubService.updateFile(COMMENTS_GITHUB_PATH, commentsData, `Added ${body.initialCommentCount} comments to ${updatedProject.slug}`);
        }

      } catch (commentError) {
        console.error('Failed to append comments:', commentError);
      }
    }

    // --- Telegram Notification ---
    const changedFields = Object.keys(body).filter(k => k !== 'initialCommentCount').join(', ');
    const updateMessage = `✏️ **PROJECT UPDATED**\n\n**Title:** ${updatedProject.title}\n**ID:** ${updatedProject.id}\n**Changes:** ${changedFields || 'No specific fields'}\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(updateMessage);

    // Auto-revalidate paths so updates appear immediately
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
      console.warn('Validation Error (Update):', error.format());
      return NextResponse.json(
        { error: 'Validation Failed', details: error.format() },
        { status: 400 }
      );
    }
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

    // Auto-revalidate paths so deletion is reflected immediately
    revalidatePath('/', 'layout');
    revalidatePath('/works');
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
