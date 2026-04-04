import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { generateGenZComments } from '@/lib/magic';
import { db } from '@/lib/firebaseAdmin';
import { sendTelegramAlert } from '@/lib/telegram';
import { CreateProjectSchema } from '@/lib/validations';
import { success, created, unauthorized, serverError, validationError } from '@/lib/api-response';
import { resolveStorageUrl } from '@/lib/urlResolver';

export const dynamic = 'force-dynamic';

// GET - Read all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const fresh = searchParams.get('fresh') === 'true';
    
    // Jika admin minta fresh data, skip cache (noCache=true)
    const { projects, lastUpdated } = await projectService.getProjects(status, fresh);

    // Fix GCS storage URLs → Firebase Storage URLs (prevents 403 Forbidden)
    const fixedProjects = projects.map(p => ({
      ...p,
      cover: resolveStorageUrl(p.cover),
      galleryItems: p.galleryItems?.map(item => ({
        ...item,
        src: resolveStorageUrl(item.src),
        poster: resolveStorageUrl(item.poster ?? ''),
      })),
      gallery: p.gallery?.map(url => resolveStorageUrl(url) || url),
    }));

    return success({ projects: fixedProjects, lastUpdated });
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
    const newProject = await projectService.createProject(projectData as unknown as import('@/types/projects').CreateProjectData);

    // --- Auto-Generate Comments (Firebase) ---
    if (validationResult.data.initialCommentCount && validationResult.data.initialCommentCount > 0) {
      try {
        const generatedComments = generateGenZComments(newProject.slug, validationResult.data.initialCommentCount);

        // Save directly to Firebase
        await db.ref(`comments/${newProject.slug}`).set(generatedComments);
        console.log(`[API/Projects] Successfully generated ${generatedComments.length} comments for ${newProject.slug}`);
      } catch (commentErr) {
        console.warn('[API/Projects] Failed to auto-generate comments:', commentErr);
      }
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
