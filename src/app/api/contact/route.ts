import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/database';
import { ContactData, UpdateContactData, ContactContent, ContactInfo, ContactFormSettings } from '@/types/contact';
import { validateAdminRequest } from '@/lib/auth';
import { getContactData, invalidateContactCache } from '@/lib/contact';
import { updateContactSchema } from '@/lib/validations';

// GET - Read contact content
export async function GET(request: NextRequest) {
  try {
    const fresh = request.nextUrl.searchParams.get('fresh') === 'true';
    const data = await getContactData(fresh);
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

    const rawBody = await request.json();

    const validation = updateContactSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid contact payload',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const body: UpdateContactData = validation.data as UpdateContactData;

    const contactRef = db.ref('content/contact');
    const snap = await contactRef.once('value');
    const dbData = snap.val() as ContactData | null;
    const data = dbData || await getContactData();

    // Deep merge to prevent data loss on partial updates
    const updatedData: ContactData = {
      content: body.content ? { ...data.content, ...body.content } as ContactContent : data.content,
      info: body.info ? {
        ...data.info,
        ...body.info,
        // Deep merge socialMedia to prevent overwriting
        socialMedia: body.info.socialMedia 
          ? { ...(data.info?.socialMedia || {}), ...body.info.socialMedia }
          : data.info?.socialMedia,
      } as ContactInfo : data.info,
      formSettings: body.formSettings ? {
        ...data.formSettings,
        ...body.formSettings,
      } as ContactFormSettings : data.formSettings,
      lastUpdated: new Date().toISOString()
    };

    await contactRef.set(updatedData);
    invalidateContactCache();

    // Revalidate ISR halaman /contact
    revalidatePath('/contact');
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating contact data:', error);
    
    // FIXED (BUG-008): More specific error handling
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    if (error instanceof TypeError) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 422 });
    }
    if (error && typeof error === 'object' && 'code' in error) {
      const dataError = error as { code: string; message: string };
      if (dataError.code === 'PERMISSION_DENIED') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      if (dataError.code === 'NETWORK_ERROR') {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to update contact data' }, { status: 500 });
  }
}

