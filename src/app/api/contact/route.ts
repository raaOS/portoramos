import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { ContactData, UpdateContactData, ContactContent, ContactInfo, ContactFormSettings } from '@/types/contact';
import { validateAdminRequest } from '@/lib/auth';
import { githubService } from '@/lib/github';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'contact.json');
const GITHUB_PATH = 'src/data/contact.json';
const isDev = process.env.NODE_ENV === 'development';

// GET - Read contact content
export async function GET(_request: NextRequest) {
  try {
    if (isDev) {
      await ensureDataDir();
      const data = await loadData(DATA_FILE) as ContactData;
      if (!data) {
        return NextResponse.json({ error: 'Failed to load contact data' }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    // Production: read from GitHub for persistence
    try {
      const { content } = await githubService.getFileContent<ContactData>(GITHUB_PATH);
      return NextResponse.json(content);
    } catch {
      // Fallback to local file if GitHub is unavailable
      await ensureDataDir();
      const data = await loadData(DATA_FILE) as ContactData;
      if (!data) {
        return NextResponse.json({ error: 'Failed to load contact data' }, { status: 500 });
      }
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error loading contact data:', error);
    return NextResponse.json({ error: 'Failed to load contact data' }, { status: 500 });
  }
}

// PUT - Update contact content (admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json(
        { error: 'Unauthorized or invalid CSRF token' },
        { status: 401 }
      );
    }

    const body: UpdateContactData = await request.json();

    // Load current data
    let data: ContactData | null = null;
    if (isDev) {
      await ensureDataDir();
      data = await loadData(DATA_FILE) as ContactData;
    } else {
      try {
        const gh = await githubService.getFileContent<ContactData>(GITHUB_PATH);
        data = gh.content;
      } catch {
        await ensureDataDir();
        data = await loadData(DATA_FILE) as ContactData;
      }
    }

    if (!data) {
      return NextResponse.json({ error: 'Failed to load contact data' }, { status: 500 });
    }

    // Update data with new content
    const updatedData: ContactData = {
      content: body.content ? { ...data.content, ...body.content } as ContactContent : data.content,
      info: { ...data.info, ...body.info } as ContactInfo,
      formSettings: { ...data.formSettings, ...body.formSettings } as ContactFormSettings,
      lastUpdated: new Date().toISOString()
    };

    // Save data — local in dev, GitHub in production
    if (isDev) {
      const success = await saveData(DATA_FILE, updatedData);
      if (!success) {
        return NextResponse.json({ error: 'Failed to save contact data' }, { status: 500 });
      }
    } else {
      await githubService.updateFile(
        GITHUB_PATH,
        updatedData,
        `Update contact data - ${new Date().toISOString()}`
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating contact data:', error);
    return NextResponse.json({ error: 'Failed to update contact data' }, { status: 500 });
  }
}
