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

    // [STICKY NOTE] SMART MOVE: Temp -> Permanent
    // If cover image is in /temp/, move it to /assets/projects/ and rename it to [slug].ext
    if (newProject.cover && newProject.cover.startsWith('/temp/')) {
      const newCover = await finalizeMedia(newProject.cover, newProject.slug, 'projects', '');
      if (newCover !== newProject.cover) {
        newProject.cover = newCover;
      }
    }

    // Process Comparison Images
    if (newProject.comparison) {
      let hasCompChanges = false;

      // Before Image -> /assets/projects/comparisons/[slug]-before.ext
      if (newProject.comparison.beforeImage && newProject.comparison.beforeImage.startsWith('/temp/')) {
        const newBefore = await finalizeMedia(
          newProject.comparison.beforeImage,
          newProject.slug,
          'projects/comparisons',
          '-before'
        );
        if (newBefore !== newProject.comparison.beforeImage) {
          newProject.comparison.beforeImage = newBefore;
          hasCompChanges = true;
        }
      }

      // After Image -> /assets/projects/[slug]-after.ext (Separate from main cover to avoid conflict)
      if (newProject.comparison.afterImage && newProject.comparison.afterImage.startsWith('/temp/')) {
        const newAfter = await finalizeMedia(
          newProject.comparison.afterImage,
          newProject.slug,
          'projects',
          '-after' // Suffix to distinguish from main cover if separate
        );
        if (newAfter !== newProject.comparison.afterImage) {
          newProject.comparison.afterImage = newAfter;
          hasCompChanges = true;
        }
      }

      // We already have newProject object which we will return, but we need to ensure it's saved correctly.
      // `createProject` handled the initial save.
      // If we changed paths, we need to update the project again.
      if (hasCompChanges) {
        await projectService.updateProject(newProject.id, {
          id: newProject.id,
          cover: newProject.cover,
          comparison: newProject.comparison
        });
      } else if (newProject.cover !== validationResult.data.cover) {
        // Case where only cover changed and no comparison
        await projectService.updateProject(newProject.id, {
          id: newProject.id,
          cover: newProject.cover
        });
      }
    }

    // --- Auto-Generate Comments ---
    // [STICKY NOTE] GEN-Z BUZZ GENERATOR
    // Setiap kali project baru dibuat, AI otomatis membuat "Komentar Palsu" ala Gen-Z.
    // Tujuannya agar project terlihat ramai dan viral sejak detik pertama.
    try {
      const generatedComments = generateGenZComments(newProject.slug, validationResult.data.initialCommentCount);

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

      // Add new comments
      commentsData.comments[newProject.slug] = generatedComments;

      // Save data
      if (isDev) {
        await saveData(COMMENTS_DATA_FILE, commentsData);
      } else {
        await githubService.updateFile(COMMENTS_GITHUB_PATH, commentsData, `Auto-generated comments for ${newProject.slug}`);
      }

    } catch {
      // Silently handle comment generation errors
      // We continue even if comment generation fails
    }

    const successMessage = `✨ **NEW PROJECT CREATED**\n\n**Title:** ${newProject.title}\n**Client:** ${newProject.client}\n**ID:** ${newProject.id}\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(successMessage);

    // Auto-revalidate paths so the new project appears immediately on public pages
    revalidatePath('/', 'layout');
    revalidatePath('/projects');
    revalidatePath('/admin');

    return created(newProject, 'Project created successfully');
  } catch (error) {
    console.error('[API /projects POST] Error:', error);

    if (error instanceof z.ZodError) {
      return validationError(error);
    }

    return serverError('Failed to create project');
  }
}

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

    const targetDir = path.join(publicDir, 'assets', subDir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const newPath = path.join(targetDir, newFilename);

    await fs.promises.rename(oldPath, newPath);

    return `/assets/${subDir}/${newFilename}`;
  } catch {
    return url;
  }
}
