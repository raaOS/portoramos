import React from 'react';

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
          className="absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-black transition-all duration-300"
          style={{ width: `${(currentStep - 1) * 50}%` }}
        ></div>

        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              currentStep >= step ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            {currentStep > step ? '✓' : step}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
        <span>1. Setup</span>
        <span>2. Media</span>
        <span>3. Review</span>
      </div>
    </div>
  );
}
