'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileText, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { m, AnimatePresence } from 'motion/react';
import type { WorkflowStep } from '@/types/about';

interface FlowchartProcessProps {
  workflowSteps: WorkflowStep[];
}

export const FlowchartProcess = ({ workflowSteps }: FlowchartProcessProps) => {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Keyboard Navigation
  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (!activeStepId || !workflowSteps) return;
    const currentIndex = workflowSteps.findIndex(s => s.id === activeStepId);
    if (currentIndex === -1) return;
    
    if (direction === 'next' && currentIndex < workflowSteps.length - 1) {
      setActiveStepId(workflowSteps[currentIndex + 1].id);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveStepId(workflowSteps[currentIndex - 1].id);
    }
  }, [activeStepId, workflowSteps]);

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
    return <div className="text-gray-400 text-sm italic py-4">Workflow data tidak tersedia</div>;
  }

  const activeStep = workflowSteps.find(s => s.id === activeStepId) || null;
  const activeIndex = workflowSteps.findIndex(s => s.id === activeStepId);

  return (
    <div className="w-full relative">
      {/* Grid Area */}
      <div className="py-4">
        <div className="flex flex-wrap gap-8 sm:gap-10 content-start">
            {workflowSteps.map((step) => {
                if (!step) return null;
                return (
                    <div 
                        key={step.id}
                        onClick={() => setActiveStepId(step.id)}
                        className="flex flex-col items-center gap-3 w-20 sm:w-24 cursor-pointer group"
                    >
                        {/* DOCX Icon Design */}
                        <div className="relative w-16 h-20 sm:w-20 sm:h-24 flex flex-col items-center justify-center transition-all group-active:scale-95 group-hover:scale-105">
                            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-500 mb-2 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-sm" strokeWidth={1.5} />
                            <div className="absolute bottom-2 bg-blue-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
                                DOCX
                            </div>
                        </div>
                        {/* Label */}
                        <span className="text-[10px] sm:text-[11px] font-medium text-center text-gray-700 dark:text-gray-300 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3 px-1">
                            Step {step.number} - {step.title}.docx
                        </span>
                    </div>
                );
            })}
        </div>
      </div>

      {/* MODAL OVERLAY (Quick Look Style via Portal) */}
      {mounted && createPortal(
        <AnimatePresence>
          {activeStep && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/70 dark:bg-black/90 backdrop-blur-md p-4 sm:p-8"
            >
              {/* Close Button */}
              <button 
                  onClick={() => setActiveStepId(null)}
                  className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[60]"
              >
                  <X size={24} />
              </button>

              {/* Navigation Left */}
              {activeIndex > 0 && (
                  <button 
                      onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
                      className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all z-[60]"
                  >
                      <ChevronLeft size={32} />
                  </button>
              )}

              {/* Navigation Right */}
              {activeIndex < workflowSteps.length - 1 && (
                  <button 
                      onClick={(e) => { e.stopPropagation(); navigate('next'); }}
                      className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all z-[60]"
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
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full max-w-2xl bg-white dark:bg-[#151515] shadow-2xl rounded-xl border border-white/10 shrink-0 pointer-events-auto overflow-hidden flex flex-col"
              >
                  <div 
                      data-lenis-prevent="true"
                      className="w-full max-h-[65vh] p-8 sm:p-12 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-black/20 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [scrollbar-width:thin]"
                  >
                      {/* Document Header */}
                      <div className="mb-8 border-b-2 border-gray-100 dark:border-white/5 pb-6">
                          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono mb-4 uppercase tracking-widest">
                              CONFIDENTIAL / WORKFLOW / {activeStep.number}
                          </p>
                          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                              {activeStep.title}
                          </h1>
                          <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-4">
                              {activeStep.subtitle}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-serif">
                              {activeStep.description}
                          </p>
                      </div>

                      {/* Document Points / SubSteps */}
                      <div className="space-y-6">
                          {activeStep.subSteps?.map((sub, idx) => (
                              <div key={sub.id} className="relative pl-6 sm:pl-8 group">
                                  <div className="absolute left-0 top-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-blue-500/20 border border-blue-500 group-hover:bg-blue-500 transition-colors"></div>
                                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                                      {idx + 1}. {sub.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-serif">
                                      {sub.description}
                                  </p>
                              </div>
                          ))}
                      </div>

                      {/* Document Footer Note */}
                      {activeStep.loopTargets && activeStep.loopTargets.length > 0 && (
                          <div className="mt-12 pt-6 border-t border-gray-100 dark:border-white/5">
                              <p className="text-[11px] text-gray-400 dark:text-gray-600 italic font-serif">
                                  * Catatan Iterasi: Dapat berulang (loop) kembali ke tahap {activeStep.loopTargets.join(', ')}.
                              </p>
                          </div>
                      )}
                  </div>
              </m.div>

              {/* Bottom Thumbnails */}
              <div className="mt-8 sm:mt-10 flex gap-4 sm:gap-6 justify-center w-full px-4 overflow-x-auto py-4 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {workflowSteps.map((step) => {
                      const isActive = step.id === activeStep.id;
                      return (
                          <div 
                              key={`thumb-${step.id}`}
                              onClick={() => setActiveStepId(step.id)}
                              className={`flex-shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 w-16 sm:w-20
                                  ${isActive ? 'scale-110 opacity-100' : 'opacity-50 hover:opacity-100 hover:scale-105'}`}
                          >
                              <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-2 transition-all duration-300 ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 2 : 1.5} />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-white/50'}`}>
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
