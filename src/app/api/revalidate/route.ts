import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/auth'

const ALLOWED_PATHS = new Set([
  '/',
  '/about',
  '/contact',
  '/works',
  '/cv',
])

const ALLOWED_PREFIXES = ['/works/']

function isAllowedPath(path: string) {
  if (ALLOWED_PATHS.has(path)) return true
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const path = request.nextUrl.searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
  }

  if (!path.startsWith('/')) {
    return NextResponse.json({ error: 'Path must start with "/"' }, { status: 400 })
  }

  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 })
  }

  try {
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, path })
  } catch (error) {
    console.error('Error revalidating path:', error)
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ error: 'Use POST with auth' }, { status: 405 })
}
