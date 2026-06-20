import { useState } from 'react';
import { Project } from '@/types/projects';

export function useProjectWizard(project?: Project) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormRevealed, setIsFormRevealed] = useState(!!project); // Auto reveal if editing

  // Determine initial primary media format. Gallery is supporting content,
  // so it should not override the cover/comparison choice.
  const [mediaFormat, setMediaFormat] = useState<'single' | 'comparison'>(() => {
    if (project) {
      if (project.comparison && project.comparison.beforeImage) {
        return 'comparison';
      }
    }
    return 'single';
  });

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const revealForm = () => setIsFormRevealed(true);

  return {
    currentStep,
    setCurrentStep,
    isFormRevealed,
    revealForm,
    mediaFormat,
    setMediaFormat,
    handleNext,
    handleBack,
  };
}
