export interface MissionControlWindow {
  id: string;
  isOpen: boolean;
  isMinimized?: boolean;
  width?: number;
  height?: number;
}

export interface MissionTarget {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export function computeMissionTargets(
  windows: MissionControlWindow[],
  viewportWidth: number,
  viewportHeight: number
): Map<string, MissionTarget> {
  const openWindows = windows.filter((window) => window.isOpen && !window.isMinimized);
  const targets = new Map<string, MissionTarget>();
  const count = openWindows.length;
  if (count === 0) return targets;

  const cols = count === 1 ? 1 : Math.min(count, 3);
  const rows = Math.ceil(count / cols);
  const gap = 40;
  const menubarHeight = 44;
  const availableWidth = viewportWidth - gap * (cols + 1);
  const availableHeight = viewportHeight - menubarHeight - 80 - gap * (rows + 1);
  const cellWidth = Math.floor(availableWidth / cols);
  const cellHeight = Math.floor(availableHeight / rows);
  const gridStartX = gap;
  const totalGridHeight = rows * cellHeight + (rows - 1) * gap;
  const gridStartY =
    menubarHeight + Math.floor((viewportHeight - menubarHeight - 80 - totalGridHeight) / 2);

  openWindows.forEach((window, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const centerX = gridStartX + col * (cellWidth + gap) + Math.floor(cellWidth / 2);
    const centerY = gridStartY + row * (cellHeight + gap) + Math.floor(cellHeight / 2);
    const windowWidth = window.width || 800;
    const windowHeight = window.height || 600;
    const scaleX = (cellWidth - 20) / windowWidth;
    const scaleY = (cellHeight - 20) / windowHeight;
    const scale = Math.min(0.65, scaleX, scaleY);

    targets.set(window.id, {
      x: centerX - Math.floor(windowWidth / 2),
      y: centerY - Math.floor(windowHeight / 2),
      width: windowWidth,
      height: windowHeight,
      scale,
    });
  });

  return targets;
}
