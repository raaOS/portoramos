'use client';

import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText, localizeWorkflowSteps } from '@/lib/i18n/contentLocalization';
import type { AboutData } from '@/types/about';

import { FlowchartProcess } from '@/components/ui/FlowchartProcess';

interface PhilosophyTabProps {
  aboutData: AboutData | null | undefined;
}

export const PhilosophyTab = ({ aboutData }: PhilosophyTabProps) => {
  const { locale } = useLanguage();
  const philosophy = aboutData?.designPhilosophy;
  const workflowSteps = useMemo(
    () => localizeWorkflowSteps(philosophy?.workflowSteps, locale),
    [locale, philosophy?.workflowSteps]
  );

  // Defensive: cek workflowSteps ada dan valid
  const hasWorkflowSteps =
    workflowSteps && Array.isArray(workflowSteps) && workflowSteps.length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 min-w-0 space-y-6 duration-300">
      <div>
        <h1 className="about-heading mb-2 break-words text-2xl font-bold text-black dark:text-white">
          {localizeText(philosophy?.heading || 'Design Philosophy', locale)}
        </h1>
        <p className="break-words font-medium text-gray-600 dark:text-gray-400">
          {localizeText(philosophy?.subheading || 'Strategic Thinking Framework', locale)}
        </p>
      </div>

      <div className="w-full min-w-0">
        {hasWorkflowSteps ? (
          <FlowchartProcess workflowSteps={workflowSteps} />
        ) : (
          <div className="py-4 text-sm italic text-gray-400">
            {localizeText('Workflow data sedang dimuat atau tidak tersedia.', locale)}
          </div>
        )}
      </div>
    </div>
  );
};
