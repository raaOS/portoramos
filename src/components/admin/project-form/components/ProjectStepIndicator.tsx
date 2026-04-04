import React from 'react';

interface ProjectStepIndicatorProps {
    currentStep: number;
}

export default function ProjectStepIndicator({ currentStep }: ProjectStepIndicatorProps) {
    return (
        <div className="mb-6 px-4">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full bg-gray-200 -translate-y-1/2"></div>
                <div 
                    className="absolute left-0 top-1/2 -z-10 h-0.5 bg-black transition-all duration-300 -translate-y-1/2" 
                    style={{ width: `${(currentStep - 1) * 50}%` }}
                ></div>

                {[1, 2, 3].map((step) => (
                    <div 
                        key={step} 
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            currentStep >= step ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                    >
                        {currentStep > step ? '✓' : step}
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-2">
                <span>1. Setup</span>
                <span>2. Media</span>
                <span>3. Review</span>
            </div>
        </div>
    );
}
