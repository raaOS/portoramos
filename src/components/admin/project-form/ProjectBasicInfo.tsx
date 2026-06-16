/**
 * Project Basic Info — form metadata proyek.
 *
 * Komponen ini menjadi orchestrator untuk metadata, tags, software, dan telemetry.
 * Detail render tiap section dipisah agar perubahan UI lebih kecil risikonya.
 *
 * @module components/admin/project-form/ProjectBasicInfo
 */
import { useState } from 'react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { Project } from '@/types/projects';
import { Label } from '@/types/labels';
import ProjectMetadataFields from './components/basic-info/ProjectMetadataFields';
import ProjectSoftwarePickerModal from './components/basic-info/ProjectSoftwarePickerModal';
import ProjectSoftwareSection from './components/basic-info/ProjectSoftwareSection';
import ProjectTagEditor from './components/basic-info/ProjectTagEditor';
import ProjectTelemetryFields from './components/basic-info/ProjectTelemetryFields';

interface ProjectBasicInfoProps {
  formData: ProjectFormData;
  errors: Record<string, string>;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
  allProjects?: Project[];
  labels?: Label[];
  showViralStats?: boolean;
  mode?: 'metadata' | 'telemetry';
}

export default function ProjectBasicInfo({
  formData,
  errors,
  updateField,
  showViralStats = false,
  mode,
}: ProjectBasicInfoProps) {
  const [isSoftwareModalOpen, setIsSoftwareModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Adobe Creative Cloud');

  const showMetadata = !mode || mode === 'metadata';
  const showTelemetry = !mode || mode === 'telemetry';

  const closeSoftwareModal = () => {
    setIsSoftwareModalOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {showMetadata && (
        <div className="space-y-6">
          <ProjectMetadataFields formData={formData} errors={errors} updateField={updateField} />
          <ProjectTagEditor formData={formData} updateField={updateField} />
          <ProjectSoftwareSection
            formData={formData}
            updateField={updateField}
            onOpenModal={() => setIsSoftwareModalOpen(true)}
          />
        </div>
      )}

      {showTelemetry && (
        <div className="space-y-4">
          <ProjectTelemetryFields
            formData={formData}
            showViralStats={showViralStats}
            updateField={updateField}
          />
        </div>
      )}

      {isSoftwareModalOpen && (
        <ProjectSoftwarePickerModal
          activeCategory={activeCategory}
          formData={formData}
          searchQuery={searchQuery}
          onActiveCategoryChange={setActiveCategory}
          onClose={closeSoftwareModal}
          onSearchChange={setSearchQuery}
          updateField={updateField}
        />
      )}
    </div>
  );
}
