/**
 * ProjectForm Component
 * Refactored into sub-components for better maintainability.
 */
import { useState } from 'react';
import { useProjectForm } from '@/hooks/useProjectForm';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import AdminModal from '@/app/admin/components/AdminModal';
import AdminButton from '@/app/admin/components/AdminButton';
import { uploadToGitHub } from '@/lib/githubUpload'; // Import helper

// Sub-components
import ProjectBasicInfo from './ProjectBasicInfo';
import ProjectMediaUpload from './ProjectMediaUpload';
import ProjectNarrative from './ProjectNarrative';
import ProjectAIHelper from './ProjectAIHelper';

interface ProjectFormProps {
    project?: Project;
    allProjects?: Project[];
    onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
    onCancel: () => void;
    title: string;
}

export default function ProjectForm({ project, allProjects = [], onSubmit, onCancel, title }: ProjectFormProps) {
    const {
        formData,
        errors,
        isDetectingDimensions,
        updateField,

        getSubmitData
    } = useProjectForm(project);

    // State for deferred upload
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = getSubmitData();
        if (!submitData) return;

        try {
            // Upload Cover if pending
            if (pendingCoverFile) {
                setIsUploading(true);
                const { url } = await uploadToGitHub(pendingCoverFile);
                submitData.cover = url;
            }

            await onSubmit(submitData);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload cover image. Please try again.");
        } finally {
            setIsUploading(false);
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
            size="2xl"
            actions={
                <div className="flex space-x-3">
                    <AdminButton variant="secondary" onClick={onCancel} disabled={isUploading}>
                        Cancel
                    </AdminButton>
                    <AdminButton onClick={handleButtonClick} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : (project ? 'Update Project' : 'Create Project')}
                    </AdminButton>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Visuals & Media */}
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-none border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                            Visual Assets
                        </h3>

                        <ProjectMediaUpload
                            formData={formData}
                            errors={errors}
                            isDetectingDimensions={isDetectingDimensions}
                            updateField={updateField}
                            slug={formData.slug}
                            onFileChange={setPendingCoverFile}
                        />
                    </div>
                </div>

                {/* ProjectGalleryManager Removed */}


                {/* Right Column: Metadata & AI */}
                <div className="space-y-6">
                    <ProjectAIHelper
                        cover={formData.cover}
                        pendingFile={pendingCoverFile}
                        slug={formData.slug || ''}
                        onGenerate={(data) => {
                            // 1. Basic Info
                            updateField('title', data.title);
                            updateField('description', data.description);
                            updateField('client', data.client);
                            // NOTE: User requested NOT to auto-fill tags
                            // updateField('tags', Array.isArray(data.tags) ? data.tags.join(', ') : data.tags);

                            // 2. Case Study Metadata
                            updateField('type', data.type);
                            updateField('role', data.role);
                            updateField('team', data.team);
                            updateField('timeline', data.timeline);

                            // 3. Narrative
                            if (data.narrative) {
                                updateField('narrative', data.narrative);
                            }
                        }}
                    />

                    <ProjectBasicInfo
                        formData={formData}
                        errors={errors}
                        updateField={updateField}
                        allProjects={allProjects}
                    />

                    <ProjectNarrative
                        formData={formData}
                        updateField={updateField}
                    />

                    {/* ProjectExternalLinks removed */}
                </div>
            </form>
        </AdminModal >
    );
}
