export async function GET() {
  // Return an empty transparent 1x1 image as fallback
  const transparentPixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  return new Response(transparentPixel, {
    status: 200,
    headers: {
      'content-type': 'image/gif',
      'cache-control': 'public, max-age=86400',
    },
  });
}
