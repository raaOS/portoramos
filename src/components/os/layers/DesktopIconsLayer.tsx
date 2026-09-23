'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { m } from 'motion/react';
import DesktopIcon from '../ui/elements/DesktopIcon';
import type { DesktopIconSize } from '@/types/about';
import { useDesktopWindowContext } from '../context/DesktopWindowContext';
import { useUnifiedZIndex } from '../context/UnifiedZIndexContext';
import type { DesktopIconsLayerProps, ProjectIcon } from './desktop-icons/types';
import {
  desktopContainerVariants,
  desktopItemVariants,
} from './desktop-icons/desktopIconsAnimation';
import { useDesktopIconTransitions } from './desktop-icons/useDesktopIconTransitions';

const MacFolder = dynamic(() => import('../windows/MacFolder'), {
  loading: () => <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200/50" />,
  ssr: false,
});

function DesktopIconsLayer({
  projectIcons,
  isMobile,
  isAdmin,
  isReady = true,
  handleIconPositionChange,
  handleIconZIndexChange,
  handleIconSizeChange,
  openProjectWindow,
}: DesktopIconsLayerProps) {
  const { windows } = useDesktopWindowContext();
  const { getZIndex, bringToFront, registerElement, unregisterElement } = useUnifiedZIndex();

  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const iconRefs = useRef<Record<string, HTMLElement | null>>({});
  const registeredIconIdsRef = useRef<Set<string>>(new Set());

  const { openingIconId, closingToIconId, triggerOpenProject } = useDesktopIconTransitions({
    windows,
    openProjectWindow,
  });

  useEffect(() => {
    const nextIds = new Set<string>();

    projectIcons.forEach((icon) => {
      nextIds.add(icon.id);
      if (!registeredIconIdsRef.current.has(icon.id)) {
        registerElement(icon.id, 'desktopIcon', icon.zIndex);
      }
    });

    registeredIconIdsRef.current.forEach((id) => {
      if (!nextIds.has(id)) {
        unregisterElement(id);
      }
    });

    registeredIconIdsRef.current = nextIds;
  }, [projectIcons, registerElement, unregisterElement]);

  useEffect(() => {
    return () => {
      registeredIconIdsRef.current.forEach((id) => unregisterElement(id));
      registeredIconIdsRef.current.clear();
    };
  }, [unregisterElement]);

  const bringIconToFront = useCallback(
    (icon: ProjectIcon) => {
      const nextZIndex = bringToFront(icon.id, 'desktopIcon');
      handleIconZIndexChange(icon.id, nextZIndex, { x: icon.x, y: icon.y });
    },
    [bringToFront, handleIconZIndexChange]
  );

  const handleIconSizeRequest = useCallback(
    (icon: ProjectIcon, size: DesktopIconSize) => {
      if (!isAdmin) return;
      handleIconSizeChange(icon.id, size, { x: icon.x, y: icon.y });
    },
    [handleIconSizeChange, isAdmin]
  );

  return (
    <>
      <div
        className="pointer-events-auto absolute inset-0"
        onClick={() => setSelectedIconId(null)}
      >
        <m.div
          className="pointer-events-none relative h-full w-full"
          variants={desktopContainerVariants}
          initial="hidden"
          animate={isReady ? 'show' : 'hidden'}
        >
          {projectIcons.map((icon) => {
            const isSelected = selectedIconId === icon.id;
            const isOpen = windows.some((w) => w.id === icon.id || w.id.includes(icon.id));
            const zIndex = getZIndex(icon.id);
            const iconSize = icon.size ?? 'medium';
            const folderSize = {
              small: 0.75,
              medium: 0.85,
              large: 1,
            }[iconSize];

            return (
              <m.div
                key={icon.id}
                ref={(el) => {
                  if (el) iconRefs.current[icon.id] = el;
                }}
                variants={desktopItemVariants}
                className="pointer-events-none"
                style={{
                  position: 'absolute',
                  left: icon.x,
                  top: icon.y,
                  zIndex,
                }}
              >
                <DesktopIcon
                  {...icon}
                  x={0}
                  y={0}
                  size={iconSize}
                  icon={!icon.type || icon.type !== 'folder' ? icon.icon : undefined}
                  isMobile={isMobile}
                  priority={icon.priority}
                  isSelected={isSelected}
                  activeScale={
                    openingIconId === icon.id ? 1.15 : closingToIconId === icon.id ? 0.92 : 1
                  }
                  onPositionChange={(id, relX, relY) => {
                    handleIconPositionChange(id, icon.x + relX, icon.y + relY);
                  }}
                  onFocus={() => bringIconToFront(icon)}
                  onSizeChange={isAdmin ? (size) => handleIconSizeRequest(icon, size) : undefined}
                  onClick={() => {
                    setSelectedIconId(icon.id);
                    if (isMobile || (typeof window !== 'undefined' && window.innerWidth < 768)) {
                      if (icon.data) {
                        const el = iconRefs.current[icon.id];
                        const rect = el?.getBoundingClientRect();
                        triggerOpenProject(
                          icon.id,
                          icon.data,
                          rect
                            ? {
                                x: rect.left,
                                y: rect.top,
                                width: rect.width,
                                height: rect.height,
                              }
                            : undefined
                        );
                      } else if (icon.action) {
                        icon.action();
                      }
                    }
                  }}
                  onDoubleClick={() => {
                    if (icon.data) {
                      const el = iconRefs.current[icon.id];
                      const rect = el?.getBoundingClientRect();
                      triggerOpenProject(
                        icon.id,
                        icon.data,
                        rect
                          ? {
                              x: rect.left,
                              y: rect.top,
                              width: rect.width,
                              height: rect.height,
                            }
                          : undefined
                      );
                    } else if (icon.action) {
                      icon.action();
                    }
                  }}
                >
                  {icon.type === 'folder' && (
                    <MacFolder size={folderSize} isStatic={true} open={isOpen} />
                  )}
                </DesktopIcon>
              </m.div>
            );
          })}
        </m.div>
      </div>
    </>
  );
}

export default React.memo(DesktopIconsLayer);
export type { ProjectIcon };
