'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileText, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { m, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/lib/i18n/contentLocalization';
import type { WorkflowStep } from '@/types/about';

interface FlowchartProcessProps {
  workflowSteps: WorkflowStep[];
}

export const FlowchartProcess = ({ workflowSteps }: FlowchartProcessProps) => {
  const { locale } = useLanguage();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Keyboard Navigation
  const navigate = useCallback(
    (direction: 'next' | 'prev') => {
      if (!activeStepId || !workflowSteps) return;
      const currentIndex = workflowSteps.findIndex((s) => s.id === activeStepId);
      if (currentIndex === -1) return;

      if (direction === 'next' && currentIndex < workflowSteps.length - 1) {
        setActiveStepId(workflowSteps[currentIndex + 1].id);
      } else if (direction === 'prev' && currentIndex > 0) {
        setActiveStepId(workflowSteps[currentIndex - 1].id);
      }
    },
    [activeStepId, workflowSteps]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeStepId) return;
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'Escape') setActiveStepId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStepId, navigate]);

  // Defensive: ensure steps is array
  if (!workflowSteps || !Array.isArray(workflowSteps) || workflowSteps.length === 0) {
    return (
      <div className="py-4 text-sm italic text-gray-400">
        {localizeText('Workflow data tidak tersedia', locale)}
      </div>
    );
  }

  const activeStep = workflowSteps.find((s) => s.id === activeStepId) || null;
  const activeIndex = workflowSteps.findIndex((s) => s.id === activeStepId);

  return (
    <div className="relative w-full min-w-0">
      {/* Grid Area */}
      <div className="py-4">
        <div className="flowchart-process-grid flex min-w-0 flex-wrap content-start">
          {workflowSteps.map((step) => {
            if (!step) return null;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className="flowchart-step-card group flex cursor-pointer flex-col items-center gap-3"
              >
                {/* DOCX Icon Design */}
                <div className="relative flex h-20 w-16 flex-col items-center justify-center transition-all group-hover:scale-105 group-active:scale-95 sm:h-24 sm:w-20">
                  <FileText
                    className="flowchart-icon mb-2 text-blue-600 opacity-80 drop-shadow-sm transition-opacity group-hover:opacity-100 dark:text-blue-500"
                    strokeWidth={1.5}
                  />
                  <div className="flowchart-badge absolute bottom-2 rounded-sm bg-blue-600 px-1.5 py-0.5 font-bold text-white shadow-sm">
                    DOCX
                  </div>
                </div>
                {/* Label */}
                <span className="flowchart-label line-clamp-3 break-words px-1 text-center font-medium leading-tight text-gray-700 transition-colors group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
                  Step {step.number} - {step.title}.docx
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL OVERLAY (Quick Look Style via Portal) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {activeStep && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/70 p-4 backdrop-blur-md dark:bg-black/90 sm:p-8"
              >
                {/* Close Button */}
                <button
                  onClick={() => setActiveStepId(null)}
                  className="absolute right-4 top-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 sm:right-8 sm:top-8"
                >
                  <X size={24} />
                </button>

                {/* Navigation Left */}
                {activeIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('prev');
                    }}
                    className="absolute left-2 top-1/2 z-[60] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:scale-110 hover:bg-white/20 active:scale-95 sm:left-8 sm:h-16 sm:w-16"
                  >
                    <ChevronLeft size={32} />
                  </button>
                )}

                {/* Navigation Right */}
                {activeIndex < workflowSteps.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('next');
                    }}
                    className="absolute right-2 top-1/2 z-[60] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:scale-110 hover:bg-white/20 active:scale-95 sm:right-8 sm:h-16 sm:w-16"
                  >
                    <ChevronRight size={32} />
                  </button>
                )}

                {/* Main Document Preview */}
                <m.div
                  key={activeStep.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="pointer-events-auto flex w-full max-w-2xl shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl dark:bg-[#151515]"
                >
                  <div
                    data-lenis-prevent="true"
                    className="max-h-[65vh] w-full overflow-y-auto overscroll-contain p-8 [scrollbar-width:thin] sm:p-12 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10 hover:[&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
                  >
                    {/* Document Header */}
                    <div className="mb-8 border-b-2 border-gray-100 pb-6 dark:border-white/5">
                      <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
                        CONFIDENTIAL / WORKFLOW / {activeStep.number}
                      </p>
                      <h1 className="mb-2 text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                        {activeStep.title}
                      </h1>
                      <p className="mb-4 text-lg font-medium text-blue-600 dark:text-blue-400">
                        {activeStep.subtitle}
                      </p>
                      <p className="font-serif text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {activeStep.description}
                      </p>
                    </div>

                    {/* Document Points / SubSteps */}
                    <div className="space-y-6">
                      {activeStep.subSteps?.map((sub, idx) => (
                        <div key={sub.id} className="group relative pl-6 sm:pl-8">
                          <div className="absolute left-0 top-1.5 h-2 w-2 rounded-sm border border-blue-500 bg-blue-500/20 transition-colors group-hover:bg-blue-500 sm:h-2.5 sm:w-2.5"></div>
                          <h3 className="mb-1.5 text-base font-bold text-gray-800 dark:text-gray-200">
                            {idx + 1}. {sub.title}
                          </h3>
                          <p className="font-serif text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {sub.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Document Footer Note */}
                    {activeStep.loopTargets && activeStep.loopTargets.length > 0 && (
                      <div className="mt-12 border-t border-gray-100 pt-6 dark:border-white/5">
                        <p className="font-serif text-[11px] italic text-gray-400 dark:text-gray-600">
                          {localizeText(
                            '* Catatan Iterasi: Dapat berulang (loop) kembali ke tahap',
                            locale
                          )}{' '}
                          {activeStep.loopTargets.join(', ')}.
                        </p>
                      </div>
                    )}
                  </div>
                </m.div>

                {/* Bottom Thumbnails */}
                <div className="mt-8 flex w-full shrink-0 justify-center gap-4 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-10 sm:gap-6 [&::-webkit-scrollbar]:hidden">
                  {workflowSteps.map((step) => {
                    const isActive = step.id === activeStep.id;
                    return (
                      <div
                        key={`thumb-${step.id}`}
                        onClick={() => setActiveStepId(step.id)}
                        className={`flex w-16 flex-shrink-0 cursor-pointer flex-col items-center justify-center transition-all duration-300 sm:w-20 ${isActive ? 'scale-110 opacity-100' : 'opacity-50 hover:scale-105 hover:opacity-100'}`}
                      >
                        <div
                          className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 sm:h-14 sm:w-14 ${isActive ? 'border border-blue-500/50 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'}`}
                        >
                          <FileText
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            strokeWidth={isActive ? 2 : 1.5}
                          />
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-white/50'}`}
                        >
                          STEP {step.number}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default FlowchartProcess;
