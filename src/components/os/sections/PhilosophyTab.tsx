import React from 'react';
import type { AboutData } from '@/types/about';

import { FlowchartProcess } from '@/components/ui/FlowchartProcess';

interface PhilosophyTabProps {
  aboutData: AboutData | null | undefined;
}

export const PhilosophyTab = ({ aboutData }: PhilosophyTabProps) => {
  const philosophy = aboutData?.designPhilosophy;

  // Defensive: cek workflowSteps ada dan valid
  const hasWorkflowSteps =
    philosophy?.workflowSteps &&
    Array.isArray(philosophy.workflowSteps) &&
    philosophy.workflowSteps.length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 min-w-0 space-y-6 duration-300">
      <div>
        <h1 className="about-heading mb-2 break-words text-2xl font-bold text-black dark:text-white">
          {philosophy?.heading || 'Design Philosophy'}
        </h1>
        <p className="break-words font-medium text-gray-600 dark:text-gray-400">
          {philosophy?.subheading || 'Strategic Thinking Framework'}
        </p>
      </div>

      <div className="w-full min-w-0">
        {hasWorkflowSteps && philosophy ? (
          <FlowchartProcess workflowSteps={philosophy.workflowSteps} />
        ) : (
          <div className="py-4 text-sm italic text-gray-400">
            Workflow data sedang dimuat atau tidak tersedia.
          </div>
        )}
      </div>
    </div>
  );
};
