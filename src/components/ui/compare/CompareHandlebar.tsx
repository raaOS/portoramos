'use client';

import React from 'react';
import { AnimatePresence, motion, type MotionValue } from 'motion/react';
import { IconDotsVertical } from '@tabler/icons-react';

interface CompareHandlebarProps {
  leftPosition: MotionValue<string>;
  showHandlebar?: boolean;
}

export function CompareHandlebar({ leftPosition, showHandlebar = true }: CompareHandlebarProps) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        className="absolute top-0 z-30 m-auto h-full w-px bg-gradient-to-b from-transparent from-[5%] via-indigo-500 to-transparent to-[95%]"
        style={{
          left: leftPosition,
        }}
      >
        {showHandlebar && (
          <div className="absolute -right-2.5 top-1/2 z-30 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-white shadow-[0px_-1px_0px_0px_#FFFFFF40]">
            <IconDotsVertical className="h-4 w-4 text-black" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
