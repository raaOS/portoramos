import { useState } from 'react';
import { Project } from '@/types/projects';

export function useProjectWizard(project?: Project) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormRevealed, setIsFormRevealed] = useState(!!project); // Auto reveal if editing

  // Determine initial media format
  const [mediaFormat, setMediaFormat] = useState<'single' | 'comparison' | 'gallery'>(() => {
    if (project) {
      if (
        (project.galleryGroups && project.galleryGroups.length > 0) ||
        (project.galleryItems && project.galleryItems.length > 0)
      ) {
        return 'gallery';
      }
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
