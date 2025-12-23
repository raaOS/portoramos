import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { checkAdminAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic';

// Configure Cloudinary with proper error handling
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary environment variables')
} else {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  })
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Cloudinary configured successfully')
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if Cloudinary is configured
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudinary credentials not configured. Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in environment variables.'
        },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { public_id, resource_type = 'image' } = body

    if (!public_id) {
      return NextResponse.json(
        { success: false, error: 'public_id is required' },
        { status: 400 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️  Attempting to delete ${resource_type} from Cloudinary:`, public_id)
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type as 'image' | 'video'
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('Cloudinary delete result:', result)
    }

    if (result.result === 'ok') {
      return NextResponse.json({
        success: true,
        message: `${resource_type} deleted successfully`,
        public_id: public_id,
        result: result
      })
    } else if (result.result === 'not found') {
      return NextResponse.json({
        success: false,
        error: `${resource_type} not found in Cloudinary`,
        public_id: public_id,
        result: result
      }, { status: 404 })
    } else {
      return NextResponse.json({
        success: false,
        error: `Failed to delete ${resource_type}`,
        public_id: public_id,
        result: result
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while deleting from Cloudinary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
