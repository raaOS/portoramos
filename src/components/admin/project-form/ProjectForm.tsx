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
import ProjectGalleryManager from './ProjectGalleryManager';

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
        addGalleryItem,
        removeGalleryItem,
        toggleGalleryItem,
        addGalleryGroup,
        removeGalleryGroup,
        addGalleryItemToGroup,
        removeGalleryItemFromGroup,
        toggleGalleryItemInGroup,
        updateGroupName,
        getSubmitData
    } = useProjectForm(project);

    // State for deferred upload
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [isFormRevealed, setIsFormRevealed] = useState(!!project); // Auto reveal if editing
    const [mediaFormat, setMediaFormat] = useState<'single' | 'comparison' | 'gallery'>(() => {
        if (project) {
            if ((project.galleryGroups && project.galleryGroups.length > 0) || (project.galleryItems && project.galleryItems.length > 0)) {
                return 'gallery';
            }
            if (project.comparison && project.comparison.beforeImage) {
                return 'comparison';
            }
        }
        return 'single';
    });

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
            alert("Gagal mengunggah gambar sampul. Silakan coba lagi.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleButtonClick = () => {
        const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
        handleSubmit(syntheticEvent);
    };

    return (
        <AdminModal
            isOpen={true}
            onClose={onCancel}
            title={title}
            size="2xl"
            actions={
                <div className="flex space-x-3 w-full justify-between items-center px-2">
                    {/* Left side actions (Cancel / Back) */}
                    <div>
                        {currentStep === 1 ? (
                            <AdminButton variant="secondary" onClick={onCancel} disabled={isUploading}> Batal </AdminButton>
                        ) : (
                            <AdminButton variant="secondary" onClick={handleBack} disabled={isUploading}> Kembali </AdminButton>
                        )}
                    </div>

                    {/* Right side actions (Next / Submit) */}
                    <div>
                        {currentStep < 3 ? (
                            <AdminButton onClick={handleNext}> Lanjut: Tahap {currentStep + 1} </AdminButton>
                        ) : (
                            <div className="flex gap-2">
                                {!isFormRevealed && (
                                    <button
                                        type="button"
                                        onClick={() => setIsFormRevealed(true)}
                                        className="text-[10px] font-bold uppercase text-gray-400 hover:text-black transition-colors px-2"
                                    >
                                        Lewati AI & Isi Manual
                                    </button>
                                )}
                                <AdminButton onClick={handleButtonClick} disabled={isUploading || !isFormRevealed}>
                                    {isUploading ? 'Menyimpan...' : (project ? 'Simpan Perubahan' : 'Buat Project')}
                                </AdminButton>
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            <div className="mb-6 px-4">
                {/* Progress Indicator */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full bg-gray-200 -translate-y-1/2"></div>
                    <div className={`absolute left-0 top-1/2 -z-10 h-0.5 bg-black transition-all duration-300 -translate-y-1/2`} style={{ width: `${(currentStep - 1) * 50}%` }}></div>

                    {[1, 2, 3].map((step) => (
                        <div key={step} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${currentStep >= step ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>
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

            <form onSubmit={handleSubmit} className="min-h-[400px]">
                {/* STEP 1: SETUP - Minimalist with Checkbox Style */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 px-2">
                        {/* Section 1: Project Type */}
                        <section>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">Tipe Studi Kasus</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Pilih pendekatan yang sesuai</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="group flex items-center gap-3 py-1.5 cursor-pointer">
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'commercial'} onChange={() => updateField('type', 'commercial')} />
                                    {formData.type === 'commercial' ? (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-green-600">Komersial</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400" />
                                            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Komersial</span>
                                        </>
                                    )}
                                </label>
                                <label className="group flex items-center gap-3 py-1.5 cursor-pointer">
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'visual_art'} onChange={() => updateField('type', 'visual_art')} />
                                    {formData.type === 'visual_art' ? (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-green-600">Art Visual</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400" />
                                            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Art Visual</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </section>

                        {/* Divider */}
                        <div className="h-px bg-gray-100" />

                        {/* Section 2: Media Format */}
                        <section>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">Format Media</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Menentukan input selanjutnya</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="group flex items-center gap-3 py-1.5 cursor-pointer">
                                    <input type="radio" name="mediaFormat" className="hidden" checked={mediaFormat === 'single'} onChange={() => setMediaFormat('single')} />
                                    {mediaFormat === 'single' ? (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-green-600">Cover Saja</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400" />
                                            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Cover Saja</span>
                                        </>
                                    )}
                                </label>
                                <label className="group flex items-center gap-3 py-1.5 cursor-pointer">
                                    <input type="radio" name="mediaFormat" className="hidden" checked={mediaFormat === 'comparison'} onChange={() => setMediaFormat('comparison')} />
                                    {mediaFormat === 'comparison' ? (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-green-600">Before / After</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400" />
                                            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Before / After</span>
                                        </>
                                    )}
                                </label>
                                <label className="group flex items-center gap-3 py-1.5 cursor-pointer">
                                    <input type="radio" name="mediaFormat" className="hidden" checked={mediaFormat === 'gallery'} onChange={() => setMediaFormat('gallery')} />
                                    {mediaFormat === 'gallery' ? (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-green-600">Galeri Item</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400" />
                                            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Galeri Item</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </section>
                    </div>
                )}

                {/* STEP 2: MEDIA UPLOADS - Clean Card Layout */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Cover Image Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Cover Image</h3>
                            <ProjectMediaUpload
                                formData={formData}
                                errors={errors}
                                isDetectingDimensions={isDetectingDimensions}
                                updateField={updateField}
                                slug={formData.slug}
                                onFileChange={setPendingCoverFile}
                                mediaFormat={mediaFormat}
                            />
                        </div>

                        {/* Gallery Manager - Only for gallery format */}
                        {mediaFormat === 'gallery' && (
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Gallery Items</h3>
                                <ProjectGalleryManager
                                    formData={formData}
                                    addGalleryItem={addGalleryItem}
                                    removeGalleryItem={removeGalleryItem}
                                    toggleGalleryItem={toggleGalleryItem}
                                    addGalleryGroup={addGalleryGroup}
                                    removeGalleryGroup={removeGalleryGroup}
                                    addGalleryItemToGroup={addGalleryItemToGroup}
                                    removeGalleryItemFromGroup={removeGalleryItemFromGroup}
                                    toggleGalleryItemInGroup={toggleGalleryItemInGroup}
                                    updateGroupName={updateGroupName}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: REVIEW & AI */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ProjectAIHelper
                            cover={formData.cover}
                            pendingFile={pendingCoverFile}
                            slug={formData.slug || ''}
                            projectId={project?.id}
                            onGenerate={(data) => {
                                updateField('title', data.title);
                                updateField('description', data.description);
                                updateField('client', data.client);
                                updateField('role', data.role);
                                updateField('team', data.team);
                                updateField('timeline', data.timeline);
                                updateField('software', data.software);
                                if (data.narrative) updateField('narrative', data.narrative);
                                if (data.tags) updateField('tags', data.tags.join(', '));
                                if (data.likes !== undefined) updateField('likes', data.likes);
                                if (data.shares !== undefined) updateField('shares', data.shares);
                                if (data.isViralPackageRequested) updateField('allowComments', true);

                                // Reveal the form after generation
                                setIsFormRevealed(true);
                            }}
                        />

                        {isFormRevealed ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
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
                            </div>
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                <p className="text-sm text-gray-400 font-medium italic">Klik tombol &quot;Generate&quot; di atas untuk mengisi detail otomatis</p>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </AdminModal>
    );
}
