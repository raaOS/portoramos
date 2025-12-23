/**
 * ProjectForm Component
 * Refactored into sub-components for better maintainability.
 */
import { useProjectForm } from '@/hooks/useProjectForm';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import AdminModal from '@/app/admin/components/AdminModal';
import AdminButton from '@/app/admin/components/AdminButton';

// Sub-components
import ProjectBasicInfo from './ProjectBasicInfo';
import ProjectMediaUpload from './ProjectMediaUpload';
import ProjectGalleryManager from './ProjectGalleryManager';
import ProjectExternalLinks from './ProjectExternalLinks';

interface ProjectFormProps {
    project?: Project;
    onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
    onCancel: () => void;
    title: string;
}

export default function ProjectForm({ project, onSubmit, onCancel, title }: ProjectFormProps) {
    const {
        formData,
        errors,
        isDetectingDimensions,
        updateField,
        addGalleryItem,
        removeGalleryItem,
        toggleGalleryItem,
        getSubmitData
    } = useProjectForm(project);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = getSubmitData();
        if (submitData) {
            await onSubmit(submitData);
        }
    };

    const handleButtonClick = () => {
        // Create a synthetic event for handleSubmit
        const syntheticEvent = {
            preventDefault: () => { },
        } as React.FormEvent;
        handleSubmit(syntheticEvent);
    };

    return (
        <AdminModal
            isOpen={true}
            onClose={onCancel}
            title={title}
            size="lg"
            actions={
                <div className="flex space-x-3">
                    <AdminButton variant="secondary" onClick={onCancel}>
                        Cancel
                    </AdminButton>
                    <AdminButton onClick={handleButtonClick}>
                        {project ? 'Update Project' : 'Create Project'}
                    </AdminButton>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <ProjectBasicInfo
                    formData={formData}
                    errors={errors}
                    updateField={updateField}
                />

                <ProjectMediaUpload
                    formData={formData}
                    errors={errors}
                    isDetectingDimensions={isDetectingDimensions}
                    updateField={updateField}
                />

                <ProjectGalleryManager
                    formData={formData}
                    addGalleryItem={addGalleryItem}
                    removeGalleryItem={removeGalleryItem}
                    toggleGalleryItem={toggleGalleryItem}
                />

                <ProjectExternalLinks
                    formData={formData}
                    updateField={updateField}
                />
            </form>
        </AdminModal>
    );
}
