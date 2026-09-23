'use client';

import React from 'react';
import { useProjectForm } from '@/hooks/useProjectForm';
import type { CreateProjectData, Project, UpdateProjectData } from '@/types/projects';
import type { Label } from '@/types/labels';
import ProjectWindowModal from './components/ProjectWindowModal';
import { ProjectFormActions } from './components/ProjectFormActions';
import { ProjectMetadataFields } from './components/ProjectMetadataFields';
import { ProjectPdfUploadCard } from './components/ProjectPdfUploadCard';
import { ProjectCoverUploadCard } from './components/ProjectCoverUploadCard';
import { useProjectFormUploads } from './hooks/useProjectFormUploads';

interface ProjectFormProps {
  project?: Project;
  allProjects?: Project[];
  labels?: Label[];
  onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
  onCancel: () => void;
  title: string;
}

export default function ProjectForm({
  project,
  labels = [],
  onSubmit,
  onCancel,
  title,
}: ProjectFormProps) {
  const { formData, errors, isDetectingDimensions, updateField, getSubmitData } =
    useProjectForm(project);

  const {
    coverPreviewUrl,
    pendingPdfFile,
    pdfUploadProgress,
    coverUploadProgress,
    isSubmitting,
    coverInputRef,
    pdfInputRef,
    handleCoverSelect,
    handlePdfSelect,
    handleRemovePdf,
    handleSubmit,
  } = useProjectFormUploads({
    project,
    updateField,
    getSubmitData,
    onSubmit,
    onCancel,
  });

  const handleToggleTag = (tagSlug: string) => {
    const currentTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const index = currentTags.indexOf(tagSlug);
    let newTags: string[];
    if (index >= 0) {
      newTags = currentTags.filter((t) => t !== tagSlug);
    } else {
      newTags = [...currentTags, tagSlug];
    }
    updateField('tags', newTags.join(', '));
  };

  return (
    <ProjectWindowModal
      onClose={onCancel}
      title={title}
      actions={
        <ProjectFormActions
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onSubmit={() => handleSubmit()}
        />
      }
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Project Metadata */}
          <ProjectMetadataFields
            formData={formData}
            errors={errors}
            labels={labels}
            updateField={updateField}
            onToggleTag={handleToggleTag}
          />

          {/* Right Column: PDF Document & Thumbnail Uploads */}
          <div className="space-y-5 lg:col-span-6">
            {/* PDF Document Upload Card */}
            <ProjectPdfUploadCard
              pdfUrl={formData.pdfUrl}
              pendingPdfFile={pendingPdfFile}
              pdfUploadProgress={pdfUploadProgress}
              pdfInputRef={pdfInputRef}
              onPdfSelect={handlePdfSelect}
              onRemovePdf={handleRemovePdf}
            />

            {/* Cover / Thumbnail Upload Card */}
            <ProjectCoverUploadCard
              coverPreviewUrl={coverPreviewUrl}
              coverUploadProgress={coverUploadProgress}
              isDetectingDimensions={isDetectingDimensions}
              coverError={errors.cover}
              coverInputRef={coverInputRef}
              onCoverSelect={handleCoverSelect}
            />
          </div>
        </div>
      </form>
    </ProjectWindowModal>
  );
}
