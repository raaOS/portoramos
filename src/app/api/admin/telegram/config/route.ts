import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { getTelegramConfigSafe } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  // Check admin auth
  if (!(await validateAdminRequest(_request, { checkCsrf: false }))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await getTelegramConfigSafe();
    
    // Get internal token for clear pending updates
    const { validateConfig } = await import('@/lib/telegram');
    const validation = validateConfig();
    
    return NextResponse.json({
      ...config,
      _botToken: validation.valid ? validation.config.botToken : undefined
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
