"use client";

import { Play } from "lucide-react";
import React, { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";

// Helper to determine mobile state safely
const isMobile = () => typeof window !== "undefined" && window.innerWidth < 640;

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

function ExpandableCards({
  cards,
  selectedCard: controlledSelected,
  onSelect,
  className = "",
  cardClassName = "",
}: ExpandableCardsProps) {
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Map<number, HTMLElement>>(new Map());

  const selectedCard =
    controlledSelected !== undefined ? controlledSelected : internalSelected;

  // UX: Close on click outside
  useOnClickOutside(scrollRef, () => {
    if (selectedCard !== null) {
      handleCardClick(selectedCard);
    }
  });

  const handleCardClick = (id: number) => {
    const newId = selectedCard === id ? null : id;

    if (onSelect) {
      onSelect(newId);
    } else {
      setInternalSelected(newId);
    }

    // Smooth scroll to card
    // We wait a tick for Framer Motion to start layout animation
    setTimeout(() => {
      if (newId !== null) {
        const cardEl = cardsRef.current.get(newId);
        if (cardEl) {
          cardEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
          });
        }
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(id);
    }
  };

  return (
    <section
      className={`flex w-full flex-col gap-4 overflow-hidden p-4 ${className}`}
      aria-label="Work Experience Cards"
    >
      <div
        className="scrollbar-hide mx-auto flex overflow-x-auto pt-4 pb-8 w-full px-4 md:px-0"
        ref={scrollRef}
        style={{
          // Static scroll snap
          scrollSnapType: "x mandatory",
          scrollPaddingLeft: "20%",
        }}
      >
        <AnimatePresence mode="popLayout">
          {/* Using standard map without AnimatePresence loop which usually causes issues with layoutId if not careful. 
                 Here we just want layout animation on the cards themselves. 
             */}
          {cards.map((card) => {
            const isSelected = selectedCard === card.id;
            return (
              <motion.article
                layout // MAGIC PROP: Automates width/height/position animations
                ref={(el) => {
                  if (el) cardsRef.current.set(card.id, el);
                  else cardsRef.current.delete(card.id);
                }}
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                onKeyDown={(e) => handleKeyDown(e, card.id)}
                tabIndex={0}
                initial={false}
                animate={{
                  width: isSelected ? (isMobile() ? "calc(100vw - 32px)" : 500) : 200,
                  zIndex: isSelected ? 10 : 1
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30, // Butter smooth physics
                  mass: 0.8
                }}
                className={`
                            relative mr-4 h-[300px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border bg-background shadow-lg
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                            ${cardClassName}
                        `}
                style={{
                  scrollSnapAlign: "start",
                  transform: "translateZ(0)" // GPU
                }}
              >
                <motion.div layout className="flex h-full w-full">
                  {/* Image Section - Sticky/Fixed size visually */}
                  <motion.div
                    layout
                    className="card-overlay relative h-full w-[200px] shrink-0"
                  >
                    <img
                      alt={card.title}
                      className="h-full w-full object-cover"
                      src={card.image || "/placeholder.svg"}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                      <motion.h2 layout="position" className="font-bold text-2xl drop-shadow-md">{card.title}</motion.h2>
                      <div className="flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/30 backdrop-blur-sm">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-medium text-sm drop-shadow-md">Lihat Detail</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Content - Animate Presence for enter/exit */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: isMobile() ? "100%" : 300 }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="content-panel h-full bg-background overflow-hidden"
                      >
                        <div className="w-[300px] min-w-[300px] h-full flex flex-col justify-between p-8">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-primary-foreground text-sm leading-relaxed"
                          >
                            {card.content}
                          </motion.div>

                          {card.author && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="mt-4 flex items-center gap-3"
                            >
                              <div className="h-12 w-12 overflow-hidden rounded-full border bg-primary">
                                <img alt={card.author.name} className="h-full w-full object-cover" src={card.author.image} />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{card.author.name}</p>
                                <p className="text-primary-foreground text-xs">{card.author.role}</p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.article>
            )
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default memo(ExpandableCards);
