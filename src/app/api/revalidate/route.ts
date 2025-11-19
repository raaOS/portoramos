import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  
  if (!path) {
    return Response.json({ error: 'Path parameter is required' }, { status: 400 })
  }

  try {
    revalidatePath(path)
    return Response.json({ revalidated: true, path })
  } catch (error) {
    console.error('Error revalidating path:', error)
    return Response.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
