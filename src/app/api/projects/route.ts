import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { generateGenZComments } from '@/lib/magic';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';
import fs from 'fs';
import { sendTelegramAlert } from '@/lib/telegram';
import { CreateProjectSchema } from '@/lib/validations/project';
import { success, created, unauthorized, serverError, validationError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const COMMENTS_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'comments.json');
const COMMENTS_GITHUB_PATH = 'src/data/comments.json';

interface CommentsData {
  comments: Record<string, unknown[]>;
}

// GET - Read all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const fresh = searchParams.get('fresh') === 'true';

    const { projects, lastUpdated } = await projectService.getProjects(status, fresh);

    return success({ projects, lastUpdated });
  } catch (error) {
    console.error('[API /projects GET] Error:', error);
    return serverError('Failed to load projects');
  }
}

// POST - Create new project (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized('Invalid or missing CSRF token');
    }

    const rawBody = await request.json();

    // Validate with Zod schema
    const validationResult = CreateProjectSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return validationError(validationResult.error);
    }

    // Convert year to number if it's a string
    const projectData = {
      ...validationResult.data,
      year: typeof validationResult.data.year === 'string'
        ? parseInt(validationResult.data.year, 10)
        : validationResult.data.year
    };

    // Type assertion needed due to Zod schema allowing nulls that CreateProjectData doesn't
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newProject = await projectService.createProject(projectData as any);

    // --- Auto-Generate Comments ---
    try {
      const generatedComments = generateGenZComments(newProject.slug, validationResult.data.initialCommentCount);
      const isDev = process.env.NODE_ENV === 'development';
      let commentsData: CommentsData = { comments: {} };

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

      if (!commentsData.comments) commentsData.comments = {};
      commentsData.comments[newProject.slug] = generatedComments;

      if (isDev) {
        await saveData(COMMENTS_DATA_FILE, commentsData);
      } else {
        await githubService.updateFile(COMMENTS_GITHUB_PATH, commentsData, `Auto-generated comments for ${newProject.slug}`);
      }
    } catch {
      // Silently handle comment generation errors
    }

    const successMessage = `✨ **NEW PROJECT CREATED**\n\n**Title:** ${newProject.title}\n**Client:** ${newProject.client}\n**ID:** ${newProject.id}\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    await sendTelegramAlert(successMessage).catch(() => { });

    revalidatePath('/', 'layout');
    revalidatePath('/projects');
    revalidatePath('/admin');

    return created(newProject, 'Project created successfully');
  } catch (error) {
    console.error('[API /projects POST] Error:', error);
    if (error instanceof z.ZodError) return validationError(error);
    return serverError('Failed to create project');
  }
}
