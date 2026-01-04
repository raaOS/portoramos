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
import ProjectNarrative from './ProjectNarrative';
// import ProjectExternalLinks from './ProjectExternalLinks'; // Removed

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
            size="2xl" // Increased size for wider layout
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
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Visuals & Media */}
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                            Visual Assets
                        </h3>

                        <ProjectMediaUpload
                            formData={formData}
                            errors={errors}
                            isDetectingDimensions={isDetectingDimensions}
                            updateField={updateField}
                        />
                    </div>

                    <ProjectGalleryManager
                        formData={formData}
                        addGalleryItem={addGalleryItem}
                        removeGalleryItem={removeGalleryItem}
                        toggleGalleryItem={toggleGalleryItem}
                    />
                </div>

                {/* Right Column: Metadata & AI */}
                <div className="space-y-6">
                    <ProjectBasicInfo
                        formData={formData}
                        errors={errors}
                        updateField={updateField}
                    />

                    <ProjectNarrative
                        formData={formData}
                        updateField={updateField}
                    />

                    {/* ProjectExternalLinks removed */}
                </div>
            </form>
        </AdminModal>
    );
}
