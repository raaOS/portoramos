import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  return NextResponse.json({
    status: 'Environment check',
    cloudName: cloudName ? 'SET' : 'MISSING',
    uploadPreset: uploadPreset ? 'SET' : 'MISSING',
    cloudNameValue: cloudName || 'NOT_SET',
    uploadPresetValue: uploadPreset || 'NOT_SET',
    message: cloudName && uploadPreset 
      ? 'Configuration looks good!' 
      : 'Missing environment variables'
  })
}
