export type QuickLookMediaType = 'image' | 'video' | 'pdf' | 'text' | 'project';

export interface QuickLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: QuickLookMediaType;
  url: string;
  metadata?: string;
  onGoToDetail?: () => void;
  // Navigation props for gallery
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}
