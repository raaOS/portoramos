import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CreateProjectData } from '@/types/projects';
import { checkAdminAuth } from '@/lib/auth';
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

// Simple In-Memory Cache
let cache: {
  data: any;
  lastUpdated: string | null;
  timestamp: number;
} | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

// GET - Read all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const fresh = searchParams.get('fresh') === 'true';

    // [STICKY NOTE] SERVER-SIDE CACHING
    // Agar server tidak jebol saat ribuan user akses bersamaan.
    // Kita simpan data projects di Memory (RAM) selama 60 detik.
    // Jadi user ke-2 sampai ke-1000 akan dapat data dari Cache (sangat cepat), bukan baca file lagi.
    if (!fresh && !status && cache && (Date.now() - cache.timestamp < CACHE_TTL)) {
      return NextResponse.json({
        projects: cache.data,
        lastUpdated: cache.lastUpdated
      });
    }

    const { projects, lastUpdated } = await projectService.getProjects(status, fresh);

    // Update cache if this is a standard request (no status filter)
    if (!status) {
      cache = {
        data: projects,
        lastUpdated,
        timestamp: Date.now()
      };
    }

    return NextResponse.json({
      projects,
      lastUpdated,
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    return NextResponse.json(
      { error: 'Failed to load projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateProjectData = await request.json();

    // Validate required fields
    if (!body.title || !body.client || !body.year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newProject = await projectService.createProject(body);

    // [STICKY NOTE] SMART MOVE: Temp -> Permanent
    // If cover image is in /temp/, move it to /assets/projects/ and rename it to [slug].ext
    if (newProject.cover && newProject.cover.startsWith('/temp/')) {
      const newCover = await finalizeMedia(newProject.cover, newProject.slug);
      if (newCover !== newProject.cover) {
        await projectService.updateProject(newProject.id, { id: newProject.id, cover: newCover });
        newProject.cover = newCover; // Update response
      }
    }

    // --- Auto-Generate Comments ---
    // [STICKY NOTE] GEN-Z BUZZ GENERATOR
    // Setiap kali project baru dibuat, AI otomatis membuat "Komentar Palsu" ala Gen-Z.
    // Tujuannya agar project terlihat ramai dan viral sejak detik pertama.
    try {
      const generatedComments = generateGenZComments(newProject.slug, body.initialCommentCount);

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

    } catch (commentError) {
      console.error('Failed to auto-generate comments:', commentError);
      // We continue even if comment generation fails
    }

    const successMessage = `✨ **NEW PROJECT CREATED**\n\n**Title:** ${newProject.title}\n**Client:** ${newProject.client}\n**ID:** ${newProject.id}\n**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
    sendTelegramAlert(successMessage);

    // Auto-revalidate paths so the new project appears immediately on public pages
    revalidatePath('/', 'layout'); // Revalidate everything (simplest and safest)
    revalidatePath('/works');
    revalidatePath('/admin');


    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

async function finalizeMedia(url: string, slug: string): Promise<string> {
  if (!url || !url.startsWith('/temp/')) return url;

  try {
    const publicDir = path.join(process.cwd(), 'public');
    const relativeUrl = url.startsWith('/') ? url.slice(1) : url;
    const oldPath = path.join(publicDir, relativeUrl);

    if (!fs.existsSync(oldPath)) return url;

    const ext = path.extname(url);
    const newFilename = `${slug}${ext}`;
    const targetDir = path.join(publicDir, 'assets', 'projects');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const newPath = path.join(targetDir, newFilename);

    await fs.promises.rename(oldPath, newPath);

    return `/assets/projects/${newFilename}`;
  } catch (e) {
    console.error('Finalize Media Error:', e);
    return url;
  }
}
