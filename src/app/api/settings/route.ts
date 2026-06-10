import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { validateAdminRequest } from '@/lib/auth';
import { updateSettingsSchema } from '@/lib/validations';

const DEFAULT_BANNED_WORDS = [
  'judol',
  'slot',
  'gacor',
  'maxwin',
  'togel',
  'casino',
  'rtp',
  'pragmatic',
  'crypto',
  'bitcoin',
  'viagra',
  'bokep',
  'porn',
];

export async function getSettingsData() {
  try {
    const snap = await db.ref('settings').once('value');
    const data = snap.val();
    if (!data || !data.bannedWords || data.bannedWords.length === 0) {
      return { ...data, bannedWords: DEFAULT_BANNED_WORDS };
    }
    return data;
  } catch {
    return { bannedWords: DEFAULT_BANNED_WORDS };
  }
}

export async function GET(_request: NextRequest) {
  const data = await getSettingsData();
  const { bannedWords, ...publicSettings } = data;
  return NextResponse.json(publicSettings);
}

export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }
    const body = await request.json();

    const validation = updateSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid settings payload',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Save only validated data to CLOUDFLARE_D1 (prevents junk fields).
    // Use .update() instead of .set() to merge into the existing row —
    // .set() would overwrite the entire `settings` row, destroying nested
    // fields like adminPassword and adminOtp written by other endpoints.
    await db.ref('settings').update(validation.data);

    return NextResponse.json({ success: true, settings: validation.data });
  } catch (error: unknown) {
    console.error('[API/Settings] POST Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
