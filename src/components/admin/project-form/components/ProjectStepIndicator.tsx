/**
 * Project Step Indicator — Indikator langkah aktif pada form proyek.
 * @module components/admin/project-form/components/ProjectStepIndicator
 */
import React from 'react';
import { Check } from 'lucide-react';

interface ProjectStepIndicatorProps {
  currentStep: number;
}

export default function ProjectStepIndicator({ currentStep }: ProjectStepIndicatorProps) {
  return (
    <div className="mb-8 px-2">
      {/* Progress Indicator */}
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute left-0 top-1/2 -z-10 h-[2px] w-full -translate-y-1/2 bg-slate-100"></div>
        {/* Active progress line */}
        <div
          className="absolute left-0 top-1/2 -z-10 h-[2px] -translate-y-1/2 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep - 1) * 50}%`, backgroundColor: '#4f46e5' }}
        ></div>

        {[1, 2, 3].map((step) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <div
              key={step}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                isCompleted
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isActive
                    ? 'border-2 border-indigo-600 bg-white text-indigo-600 shadow-sm ring-4 ring-indigo-50'
                    : 'border-2 border-slate-200 bg-white text-slate-400'
              }`}
            >
              {isCompleted ? <Check className="h-4 w-4 text-white" strokeWidth={2.5} /> : step}
            </div>
          );
        })}
      </div>
      
      {/* Step Labels */}
      <div className="mt-3 flex justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        <span className={`transition-colors duration-300 ${currentStep >= 1 ? 'text-slate-800' : ''}`}>1. Setup</span>
        <span className={`transition-colors duration-300 ${currentStep >= 2 ? 'text-slate-800' : ''}`}>2. Media</span>
        <span className={`transition-colors duration-300 ${currentStep >= 3 ? 'text-slate-800' : ''}`}>3. Review</span>
      </div>
    </div>
  );
}
