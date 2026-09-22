/**
 * PDF page-1 thumbnail generator (server-side).
 *
 * Renders page 1 of a PDF to a JPEG buffer using pdfjs-dist (legacy build)
 * + @napi-rs/canvas. Used by /api/admin/upload for explorer PDF uploads
 * so the side-car `<base>.jpg` poster can be generated server-side.
 *
 * Errors are non-fatal: returns null on any failure so the upload route
 * can still complete without a poster (frontend falls back to SVG icon).
 */
const TARGET_WIDTH = 600;
const JPEG_QUALITY = 82;

export async function generatePdfThumbnail(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = await import('@napi-rs/canvas');

    const doc = await pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: false,
      disableFontFace: true,
    }).promise;

    const page = await doc.getPage(1);
    const unscaled = page.getViewport({ scale: 1 });
    const scale = TARGET_WIDTH / unscaled.width;
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext('2d');

    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    // pdfjs-dist v6 has no doc.destroy(); GC handles cleanup.
    page.cleanup();

    const data = canvas.toBuffer('image/jpeg', JPEG_QUALITY);
    return Buffer.from(data);
  } catch (error) {
    console.warn('[pdfThumbnail] Failed to render PDF page 1 (non-fatal):', error);
    return null;
  }
}
