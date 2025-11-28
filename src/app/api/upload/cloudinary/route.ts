import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
// Temporarily disabled logger import to fix chunk loading issue
// import { logError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let file: File | null = null
    let folder = 'portfolio'
    let subfolder = 'general'

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data
      const formData = await req.formData()
      file = formData.get('file') as File
      folder = (formData.get('folder') as string) || 'portfolio'
      subfolder = (formData.get('subfolder') as string) || 'general'
    } else if (contentType.includes('application/json')) {
      // Handle JSON data with base64 file
      const body = await req.json()
      const { file: fileData, folder: folderData, subfolder: subfolderData } = body

      if (fileData && fileData.startsWith('data:')) {
        // Convert base64 to File object
        const [header, base64Data] = fileData.split(',')
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png'
        const buffer = Buffer.from(base64Data, 'base64')

        file = new File([buffer], 'upload.png', { type: mimeType })
        folder = folderData || 'portfolio'
        subfolder = subfolderData || 'general'
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 10MB.'
      }, { status: 400 })
    }

    // Get Cloudinary credentials from environment
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET


    if (process.env.NODE_ENV === 'development') {
      console.log('Cloudinary config check:', {
        cloudName: cloudName ? 'SET' : 'MISSING',
        uploadPreset: uploadPreset ? 'SET' : 'MISSING',
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name
      })
    }

    if (!cloudName || !uploadPreset) {
      // Temporarily disabled logger to fix chunk loading issue
      console.error('Cloudinary credentials not configured', new Error('Missing environment variables'))
      return NextResponse.json({
        error: 'Upload service not configured',
        message: 'Please create .env.local file with Cloudinary credentials',
        instructions: {
          step1: 'Create .env.local file in project root',
          step2: 'Add: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name',
          step3: 'Add: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset',
          step4: 'Restart development server',
          documentation: 'See CLOUDINARY_SETUP.md for detailed instructions'
        },
        details: {
          cloudName: cloudName ? 'SET' : 'MISSING',
          uploadPreset: uploadPreset ? 'SET' : 'MISSING'
        }
      }, { status: 500 })
    }

    // Prepare form data for Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('upload_preset', uploadPreset)
    cloudinaryFormData.append('folder', `${folder}/${subfolder}`)

    // Note: Transformation will be handled by the upload preset

    // Upload to Cloudinary with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text()
      console.error('Cloudinary upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorData,
        cloudName,
        uploadPreset,
        folder,
        url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
      })
      // Temporarily disabled logger to fix chunk loading issue
      console.error('Cloudinary upload failed', new Error(`Status: ${uploadResponse.status}, Error: ${errorData}`))
      return NextResponse.json({
        error: 'Upload failed',
        message: 'Failed to upload to Cloudinary',
        details: {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          cloudinaryError: errorData,
          config: {
            cloudName,
            uploadPreset,
            folder
          },
          troubleshooting: {
            checkUploadPreset: `Verify upload preset '${uploadPreset}' exists in Cloudinary console`,
            checkSigningMode: 'Ensure upload preset is set to Unsigned mode',
            checkPermissions: 'Verify upload preset allows the file type and size'
          }
        }
      }, { status: 500 })
    }

    const result = await uploadResponse.json()

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    })

  } catch (error) {
    console.error('Upload error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    })

    // Temporarily disabled logger to fix chunk loading issue
    console.error('Upload error', error as Error)

    // Handle specific error types
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json({
        error: 'Upload timeout',
        message: 'Upload took too long and was cancelled',
        details: {
          timeout: '30 seconds',
          suggestion: 'Try uploading a smaller file or check your internet connection'
        }
      }, { status: 408 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during upload',
      details: {
        errorType: (error as Error).name,
        errorMessage: (error as Error).message
      }
    }, { status: 500 })
  }
}
