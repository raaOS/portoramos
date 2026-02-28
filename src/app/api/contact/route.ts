import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { ContactData, UpdateContactData, ContactContent, ContactInfo, ContactFormSettings } from '@/types/contact';
import { validateAdminRequest } from '@/lib/auth';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'contact.json');

// GET - Read contact content
export async function GET(_request: NextRequest) {
  try {
    await ensureDataDir();
    const data = await loadData(DATA_FILE) as ContactData;

    if (!data) {
      return NextResponse.json({ error: 'Failed to load contact data' }, { status: 500 });
    }

    return NextResponse.json(data);
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

    await ensureDataDir();
    const data = await loadData(DATA_FILE) as ContactData;

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

    // Save data
    const success = await saveData(DATA_FILE, updatedData);

    if (!success) {
      return NextResponse.json({ error: 'Failed to save contact data' }, { status: 500 });
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
