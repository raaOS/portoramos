/**
 * Cloudinary Delete Utility Functions
 * 
 * This module provides utility functions for deleting images and videos from Cloudinary.
 * It includes functions to extract public IDs from Cloudinary URLs and delete resources
 * using the Cloudinary Admin API.
 * 
 * Note: This implementation is currently disabled due to API signature issues.
 * The delete functionality will be implemented when proper Cloudinary credentials are available.
 */

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL (e.g., https://res.cloudinary.com/cloud/image/upload/v123/folder/image.jpg)
 * @returns Public ID (e.g., folder/image)
 */
export function extractPublicId(url: string): string | null {
  try {
    // Match Cloudinary URL pattern
    const match = url.match(/\/(?:image|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    if (match && match[1]) {
      // Remove file extension and return public ID
      return match[1].replace(/\.[^.]+$/, '')
    }
    return null
  } catch (error) {
    console.error('Error extracting public ID from URL:', error)
    return null
  }
}

/**
 * Delete a single image or video from Cloudinary
 * @param publicId - The public ID of the resource to delete
 * @param resourceType - Type of resource ('image' or 'video')
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(
  publicId: string, 
  resourceType: 'image' | 'video' = 'image'
): Promise<{ success: boolean; message: string; details?: any }> {
  // Temporarily disabled due to API signature issues
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚧 Cloudinary delete temporarily disabled for ${resourceType}: ${publicId}`)
  }
  
  return {
    success: false,
    message: 'Cloudinary delete functionality is temporarily disabled due to API configuration issues. Files remain in Cloudinary but are removed from the database.',
    details: { publicId, resourceType, status: 'disabled' }
  }
}

/**
 * Delete image by URL (extracts public ID and deletes)
 * @param url - Cloudinary URL
 * @param resourceType - Type of resource ('image' or 'video')
 * @returns Promise with deletion result
 */
export async function deleteImageByUrl(
  url: string, 
  resourceType: 'image' | 'video' = 'image'
): Promise<{ success: boolean; message: string; publicId?: string }> {
  const publicId = extractPublicId(url)
  
  if (!publicId) {
    return {
      success: false,
      message: 'Could not extract public ID from URL'
    }
  }

  const result = await deleteFromCloudinary(publicId, resourceType)
  
  return {
    ...result,
    publicId
  }
}

/**
 * Delete multiple images/videos from Cloudinary
 * @param urls - Array of Cloudinary URLs
 * @param resourceType - Type of resource ('image' or 'video')
 * @returns Promise with batch deletion results
 */
export async function batchDeleteImages(
  urls: string[], 
  resourceType: 'image' | 'video' = 'image'
): Promise<{
  success: boolean;
  results: Array<{ url: string; success: boolean; message: string; publicId?: string }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const results = []
  let successful = 0
  let failed = 0

  for (const url of urls) {
    const result = await deleteImageByUrl(url, resourceType)
    results.push({ url, ...result })
    
    if (result.success) {
      successful++
    } else {
      failed++
    }
  }

  return {
    success: false, // Always false since delete is disabled
    results,
    summary: {
      total: urls.length,
      successful,
      failed: urls.length // All considered failed since disabled
    }
  }
}