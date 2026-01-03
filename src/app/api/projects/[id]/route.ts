import { NextRequest, NextResponse } from 'next/server';
import { UpdateProjectData } from '@/types/projects';
import { checkAdminAuth } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { generateGenZComments } from '@/lib/magic';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';
import { sendTelegramAlert } from '@/lib/telegram';

const COMMENTS_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'comments.json');
const COMMENTS_GITHUB_PATH = 'src/data/comments.json';

interface CommentsData {
  comments: Record<string, any[]>;
}

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
    const body: UpdateProjectData & { initialCommentCount?: number } = await request.json();

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

    const successMessage = `🗑️ **PROJECT DELETED**\n\n**ID:** ${id}\n**By:** Admin\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(successMessage);

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
