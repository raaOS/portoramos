import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStorageUpload } from './useStorageUpload';

type XhrCallback = ((event?: Event) => void) | null;
type XhrProgressCallback = ((event: ProgressEvent<EventTarget>) => void) | null;

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = [];

  upload: { onprogress: XhrProgressCallback; onload: XhrCallback } = {
    onprogress: null,
    onload: null,
  };
  onload: XhrCallback = null;
  onerror: XhrCallback = null;
  onabort: XhrCallback = null;
  ontimeout: XhrCallback = null;
  method = '';
  url = '';
  headers: Record<string, string> = {};
  status = 200;
  statusText = 'OK';
  responseText = '';
  withCredentials = false;
  body: XMLHttpRequestBodyInit | Document | null = null;

  constructor() {
    MockXMLHttpRequest.instances.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  send(body: XMLHttpRequestBodyInit | Document | null) {
    this.body = body;
  }

  triggerProgress(loaded: number, total: number) {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded,
      total,
    } as ProgressEvent<EventTarget>);
  }

  respond(status: number, payload: unknown, statusText = 'OK') {
    this.status = status;
    this.statusText = statusText;
    this.responseText = JSON.stringify(payload);
    this.upload.onload?.(new Event('load'));
    this.onload?.(new Event('load'));
  }
}

describe('useStorageUpload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    MockXMLHttpRequest.instances = [];
  });

  it('posts with XMLHttpRequest and reports real upload progress', async () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);
    const onUploadProgress = vi.fn();
    const { result } = renderHook(() =>
      useStorageUpload({
        folder: 'wallpapers',
        customFilename: 'hero',
        csrfToken: 'csrf-token',
      })
    );

    const uploadPromise = result.current.upload(
      new File(['image'], 'hero.png', { type: 'image/png' }),
      { onUploadProgress }
    );
    const xhr = MockXMLHttpRequest.instances[0];

    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/api/admin/upload?folder=wallpapers&filename=hero');
    expect(xhr.headers['x-csrf-token']).toBe('csrf-token');
    expect(xhr.withCredentials).toBe(true);
    expect(xhr.body).toBeInstanceOf(FormData);

    xhr.triggerProgress(40, 100);
    xhr.respond(200, {
      success: true,
      url: '/assets/wallpapers/hero.webp',
      storageProvider: 'r2',
    });

    await expect(uploadPromise).resolves.toMatchObject({
      success: true,
      url: '/assets/wallpapers/hero.webp',
      storageProvider: 'r2',
    });
    expect(onUploadProgress).toHaveBeenCalledWith(40);
    expect(onUploadProgress).toHaveBeenCalledWith(100);
  });

  it('keeps the old success-false contract on upload errors', async () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useStorageUpload({ folder: 'projects' }));

    const uploadPromise = result.current.upload(
      new File(['movie'], 'clip.mov', { type: 'video/quicktime' })
    );
    const xhr = MockXMLHttpRequest.instances[0];
    xhr.respond(400, { error: 'Invalid file type' }, 'Bad Request');

    await expect(uploadPromise).resolves.toMatchObject({
      success: false,
      error: 'Invalid file type',
    });
    expect(errorSpy).toHaveBeenCalled();
  });
});
