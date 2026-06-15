import React, { useState, useMemo, useCallback } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { ExplorerFile } from '@/types/explorer';
import { getVideoPosterSource, getVideoPreviewSource } from '@/lib/mediaPreview';

const withVideoStartTime = (src?: string | null) => {
  if (!src) return '';

  try {
    const url = new URL(src, window.location.origin);
    if (!url.hash) url.hash = 't=0.1';
    return url.toString();
  } catch {
    return src.includes('#') ? src : `${src}#t=0.1`;
  }
};

const getVideoSources = (url: string) => {
  const primary = url;
  const preview = getVideoPreviewSource(url);
  return Array.from(new Set([primary, preview].filter(Boolean)));
};

export default function ExplorerVideoPreview({ file }: { file: ExplorerFile }) {
  const sources = useMemo(() => {
    return Array.from(
      new Set([file.url, file.previewUrl, ...getVideoSources(file.url)].filter(Boolean))
    );
  }, [file.previewUrl, file.url]);

  const poster = useMemo(
    () => file.thumbnailUrl || getVideoPosterSource(file.url),
    [file.thumbnailUrl, file.url]
  );

  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const source = sources[sourceIndex] || file.url;

  const handleError = useCallback(() => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((current) => current + 1);
      setHasLoaded(false);
      return;
    }

    setHasError(true);
  }, [sourceIndex, sources.length]);

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <AlertTriangle className="h-7 w-7 text-amber-300" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-sm font-semibold">Video tidak bisa dimuat</h3>
          <p className="text-xs leading-relaxed text-white/65">
            Browser tidak menerima stream video dari storage. Coba buka file langsung atau upload
            ulang video dari Admin Explorer.
          </p>
        </div>
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          Buka file asli
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      {!hasLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-xs font-medium text-white/55">
          Memuat video...
        </div>
      )}
      <video
        key={source}
        src={withVideoStartTime(source)}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        className="relative z-10 h-full w-full bg-black object-contain"
        onLoadedData={() => setHasLoaded(true)}
        onCanPlay={() => setHasLoaded(true)}
        onError={handleError}
      />
    </div>
  );
}
