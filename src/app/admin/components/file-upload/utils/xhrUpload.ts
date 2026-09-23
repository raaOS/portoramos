export interface UploadResponse {
  url?: string;
  previewUrl?: string;
  posterUrl?: string;
  videoStats?: {
    originalSize: number;
    optimizedSize: number;
    previewSize: number;
    posterSize: number;
  } | null;
  imageStats?: {
    originalSize: number;
    optimizedSize: number;
    width?: number;
    height?: number;
  } | null;
  audioStats?: {
    originalSize: number;
    optimizedSize: number;
  } | null;
  storageProvider?: 'r2';
  success?: boolean;
  error?: string;
}

export function postFormDataWithProgress(
  url: string,
  formData: FormData,
  headers: Record<string, string>,
  onUploadProgress?: (progress: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', url);
    xhr.withCredentials = true;

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
      onUploadProgress?.(percent);
    };

    xhr.upload.onload = () => {
      onUploadProgress?.(100);
    };

    xhr.onload = () => {
      let data: UploadResponse = {};
      if (xhr.responseText) {
        try {
          data = JSON.parse(xhr.responseText) as UploadResponse;
        } catch {
          reject(new Error('Invalid response from server'));
          return;
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (data.success === false) {
          reject(new Error(data.error || 'Upload failed'));
          return;
        }
        resolve(data);
        return;
      }

      reject(new Error(data.error || xhr.statusText || `Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    xhr.send(formData);
  });
}

export function putFileWithProgress(
  uploadUrl: string,
  file: File,
  contentType: string,
  cacheControl: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('Cache-Control', cacheControl);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
      onProgress?.(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`R2 upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
    };

    xhr.onerror = () => reject(new Error('Network error during R2 upload'));
    xhr.onabort = () => reject(new Error('R2 upload cancelled'));
    xhr.ontimeout = () => reject(new Error('R2 upload timed out'));
    xhr.send(file);
  });
}
