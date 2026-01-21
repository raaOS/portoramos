"use client";

import { Play } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

// Types
export type Card = {
  id: number;
  title: string;
  image: string;
  content: React.ReactNode;
  author?: {
    name: string;
    role: string;
    image: string;
  };
};

export type ExpandableCardsProps = {
  cards: Card[];
  selectedCard?: number | null;
  onSelect?: (id: number | null) => void;
  className?: string;
  cardClassName?: string;
};

// Config - Proven iOS-like smoothness
const transitionConfig = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1.0] as const, // cubic-bezier
};

export default function ExpandableCards({
  cards,
  selectedCard: controlledSelected,
  onSelect,
  className = "",
  cardClassName = "",
}: ExpandableCardsProps) {
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCard = controlledSelected !== undefined ? controlledSelected : internalSelected;

  // Initial centering
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current;
      scrollRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
    }
  }, []);

  const handleCardClick = (id: number) => {
    // Toggle logic
    const newId = selectedCard === id ? null : id;

    if (onSelect) onSelect(newId);
    else setInternalSelected(newId);

    // Auto-center logic
    if (newId !== null) {
      const cardElement = document.querySelector(`[data-card-id="${id}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center", // Force center alignment
        });
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex w-full overflow-x-auto pb-8 pt-4 no-scrollbar"
        style={{
          scrollSnapType: "x mandatory",
          scrollPaddingLeft: "24px", // Matches container padding
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch", // iOS momentum
        }}
      >
        {/* Spacer for first item centering */}
        <div className="w-4 shrink-0" />

        {cards.map((card) => {
          const isSelected = selectedCard === card.id;

          return (
            <motion.div
              key={card.id}
              layout
              initial={false}
              data-card-id={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`relative mr-4 h-[350px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-xl group will-change-transform ${cardClassName}`}
              style={{
                scrollSnapAlign: "center", // Stable centering
                width: isSelected ? 500 : 250, // Explicit width
              }}
              animate={{
                width: isSelected ? 500 : 250,
              }}
              transition={transitionConfig}
            >
              {/* Media Background */}
              <div className="relative h-full w-[250px]"> {/* Fixed width container to prevent squash */}
                <div
                  className={`h-full w-full transition-transform duration-700 ${isSelected ? "scale-100" : "group-hover:scale-110"
                    } ${[
                      "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
                      "bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-900",
                      "bg-gradient-to-br from-blue-950 via-slate-900 to-black",
                      "bg-gradient-to-br from-emerald-900 via-slate-950 to-emerald-950",
                      "bg-gradient-to-br from-rose-950 via-slate-900 to-rose-950",
                      "bg-gradient-to-br from-amber-900/40 via-slate-950 to-amber-950/40",
                    ][card.id % 6]}`}
                />

                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white z-10">
                  <motion.h2 layout="position" className="font-bold text-2xl drop-shadow-md">
                    {card.title}
                  </motion.h2>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                    <span className="text-sm font-medium tracking-wide">View Project</span>
                  </div>
                </div>
              </div>

              {/* Expanded Content Panel */}
              <AnimatePresence mode="popLayout">
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="absolute top-0 right-0 h-full w-[250px] bg-black/60 backdrop-blur-xl border-l border-white/5 p-6 flex flex-col justify-center"
                  >
                    <div className="text-gray-200 text-sm leading-relaxed">
                      {card.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}

        {/* Spacer for last item centering */}
        <div className="w-4 shrink-0" />
      </div>
    </div>
  );
}
