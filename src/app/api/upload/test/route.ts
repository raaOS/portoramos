import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  return NextResponse.json({
    status: 'Environment check',
    cloudName: cloudName ? 'SET' : 'MISSING',
    uploadPreset: uploadPreset ? 'SET' : 'MISSING',
    message: cloudName && uploadPreset 
      ? 'Configuration looks good!' 
      : 'Missing environment variables'
  })
}
