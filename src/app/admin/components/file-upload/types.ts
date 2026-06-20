export interface UploadedAsset {
  /** Public URL of the optimized primary file (image/video/audio). */
  url: string;
  /** Optional preview clip URL — only set for video uploads. */
  previewUrl?: string;
  /**
   * Optional poster JPG URL — only set for video uploads. Use this as the
   * thumbnail for video assets in admin UIs and skeleton screens.
   */
  posterUrl?: string;
}

export interface AdminFileUploadProps {
  /** Backward-compatible URL-only callback (one entry per uploaded file). */
  onUpload: (urls: string[]) => void;
  /**
   * Optional richer callback that mirrors `onUpload` but also exposes
   * `previewUrl` / `posterUrl`. Consumers that care about video thumbnails
   * (e.g. WallpaperManager) should subscribe to this.
   */
  onUploadResult?: (results: UploadedAsset[]) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onUploadProgress?: (progress: number) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  folder?: string;
  customFilename?: string;
  enableCrop?: boolean;
  enableVideoTrim?: boolean;
  autoUpload?: boolean;
  onFileSelect?: (file: File) => void;
  /**
   * Optional async validator yang dipanggil setelah file lolos validasi
   * dasar (mime/size) tapi sebelum proses upload/compress. Return error
   * message untuk batalkan upload, atau `null` untuk lanjut.
   *
   * Berguna untuk constraint domain-specific seperti resolusi minimum
   * video wallpaper. Kalau return error, AdminFileUpload akan tampilkan
   * toast error dan tidak proses file.
   */
  customValidator?: (files: File[]) => Promise<string | null> | string | null;
  /** UI display mode: 'default' (large dropzone), 'compact' (slim bar), or 'button' (icon button). */
  variant?: 'default' | 'compact' | 'button';
}
