import type { DesktopIconSize } from '@/types/about';
import type { Project } from '@/types/projects';

export interface ProjectIcon {
  id: string;
  x: number;
  y: number;
  label: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  videoUrl?: string;
  aspectRatio?: number;
  type?: 'project' | 'folder' | string;
  data?: Project;
  action?: () => void;
  priority?: boolean;
  zIndex?: number;
  size?: DesktopIconSize;
}

export interface DesktopIconsLayerProps {
  projectIcons: ProjectIcon[];
  isMobile: boolean;
  isAdmin: boolean;
  isReady?: boolean;
  handleIconPositionChange: (id: string, x: number, y: number) => void;
  handleIconZIndexChange: (id: string, zIndex: number, position: { x: number; y: number }) => void;
  handleIconSizeChange: (
    id: string,
    size: DesktopIconSize,
    position: { x: number; y: number }
  ) => void;
  openProjectWindow: (
    project: Project,
    originRect?: { x: number; y: number; width: number; height: number }
  ) => void;
}
