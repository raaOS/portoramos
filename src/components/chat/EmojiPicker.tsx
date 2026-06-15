'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import PickerPanel from './components/PickerPanel';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      setTriggerRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && buttonRef.current) {
        setTriggerRect(buttonRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center justify-center rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884]"
        aria-label="Open emoji picker"
        aria-expanded={isOpen}
      >
        <Smile
          className={`h-6 w-6 transition-colors ${isOpen ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#00a884]'}`}
        />
      </button>

      <PickerPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onEmojiSelect={onEmojiSelect}
        triggerRect={triggerRect}
      />
    </>
  );
}
