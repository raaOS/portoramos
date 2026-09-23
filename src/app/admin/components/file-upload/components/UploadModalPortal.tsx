'use client';

import React, { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ImageCropper from '@/components/admin/ImageCropper';
import VideoTrimmer from '@/components/admin/VideoTrimmer';

export function UploadModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;

  return createPortal(<div className="fixed inset-0 z-[100000]">{children}</div>, document.body);
}

export function ImageCropperWrapper({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (b: Blob) => void;
  onCancel: () => void;
}) {
  return <ImageCropper imageSrc={src} onCropComplete={onConfirm} onCancel={onCancel} />;
}

export function VideoTrimmerWrapper({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (
    s: number,
    e: number,
    c?: { x: number; y: number; width: number; height: number } | null
  ) => void;
  onCancel: () => void;
}) {
  return <VideoTrimmer file={file} onConfirm={onConfirm} onCancel={onCancel} />;
}
