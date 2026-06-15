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
    <div className="mb-6 px-4">
      {/* Progress Indicator */}
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-gray-200"></div>
        <div
          className="absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${(currentStep - 1) * 50}%`, backgroundColor: '#00AA5B' }}
        ></div>

        {[1, 2, 3].map((step) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <div
              key={step}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                isCompleted
                  ? 'text-white shadow-sm'
                  : isActive
                    ? 'text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400'
              }`}
              style={
                isCompleted
                  ? { backgroundColor: '#00AA5B' }
                  : isActive
                    ? { backgroundColor: '#00AA5B' }
                    : undefined
              }
            >
              {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : step}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
        <span>1. Setup</span>
        <span>2. Media</span>
        <span>3. Review</span>
      </div>
    </div>
  );
}
