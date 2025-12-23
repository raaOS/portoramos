import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Cloudinary is configured
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

    const isConfigured = !!(cloudinaryUrl && cloudinaryApiKey && cloudinaryApiSecret);

    return NextResponse.json({
      configured: isConfigured,
      hasUrl: !!cloudinaryUrl,
      hasApiKey: !!cloudinaryApiKey,
      hasApiSecret: !!cloudinaryApiSecret,
    });
  } catch (error) {
    console.error('Cloudinary setup check error:', error);
    return NextResponse.json(
      { message: 'Failed to check Cloudinary setup' },
      { status: 500 }
    );
  }
}
