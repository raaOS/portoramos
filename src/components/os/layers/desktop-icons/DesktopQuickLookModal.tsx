'use client';

import React from 'react';
import QuickLookModal from '@/components/ui/QuickLookModal';
import { resolveCover } from '@/lib/images';
import type { ProjectIcon } from './types';
import type { Project } from '@/types/projects';

interface DesktopQuickLookModalProps {
  quickLookIcon: ProjectIcon | null;
  onClose: () => void;
  openProjectWindow: (project: Project) => void;
}

export function DesktopQuickLookModal({
  quickLookIcon,
  onClose,
  openProjectWindow,
}: DesktopQuickLookModalProps) {
  if (!quickLookIcon) return null;

  let type = 'project';
  let url = '';

  if (quickLookIcon.data) {
    const cover = resolveCover(quickLookIcon.data);
    type = cover.kind;
    url = cover.src;
  } else if (quickLookIcon.videoUrl) {
    type = 'video';
    url = quickLookIcon.videoUrl;
  } else if (quickLookIcon.imageUrl) {
    type = 'image';
    url = quickLookIcon.imageUrl;
  }

  return (
    <QuickLookModal
      isOpen={!!quickLookIcon}
      onClose={onClose}
      title={quickLookIcon.data?.title || quickLookIcon.label || 'Quick Look'}
      type={type as 'image' | 'video' | 'pdf' | 'text' | 'project'}
      url={url}
      metadata={quickLookIcon.data?.tags?.join(', ') || quickLookIcon.type}
      onGoToDetail={() => {
        onClose();
        if (quickLookIcon.data) {
          openProjectWindow(quickLookIcon.data);
        } else if (quickLookIcon.action) {
          quickLookIcon.action();
        }
      }}
    />
  );
}
