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
                {/* STEP 1: SETUP */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Tipe Studi Kasus</h3>
                                <p className="text-xs text-gray-500 mb-4">Pilih pendekatan yang paling sesuai dengan jenis karya ini.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`cursor-pointer p-4 border rounded-lg text-center transition-colors ${formData.type === 'commercial' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-black'}`}>
                                        <input type="radio" name="type" className="hidden" checked={formData.type === 'commercial'} onChange={() => updateField('type', 'commercial')} />
                                        <span className="font-bold text-sm block">Komersial</span>
                                        <span className={`text-[10px] ${formData.type === 'commercial' ? 'text-gray-300' : 'text-gray-500'}`}>Proyek Klien / Iklan</span>
                                    </label>
                                    <label className={`cursor-pointer p-4 border rounded-lg text-center transition-colors ${formData.type === 'visual_art' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-black'}`}>
                                        <input type="radio" name="type" className="hidden" checked={formData.type === 'visual_art'} onChange={() => updateField('type', 'visual_art')} />
                                        <span className="font-bold text-sm block">Art Visual</span>
                                        <span className={`text-[10px] ${formData.type === 'visual_art' ? 'text-gray-300' : 'text-gray-500'}`}>Eksplorasi Pribadi / Seni</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Format Media Tambahan</h3>
                                <p className="text-xs text-gray-500 mb-4">Pilihan ini menentukan input apa yang akan diminta pada langkah selanjutnya.</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <label className={`flex-1 cursor-pointer p-3 border rounded-lg text-center transition-colors ${mediaFormat === 'single' ? 'border-black bg-white shadow-sm ring-1 ring-black' : 'border-gray-200 bg-white hover:border-black'}`}>
                                        <input type="radio" name="mediaFormat" className="hidden" checked={mediaFormat === 'single'} onChange={() => setMediaFormat('single')} />
                                        <span className={`font-bold text-sm ${mediaFormat === 'single' ? 'text-black' : 'text-gray-700'}`}>Cover Saja</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer p-3 border rounded-lg text-center transition-colors ${mediaFormat === 'comparison' ? 'border-black bg-white shadow-sm ring-1 ring-black' : 'border-gray-200 bg-white hover:border-black'}`}>
                                        <input type="radio" name="mediaFormat" className="hidden" checked={mediaFormat === 'comparison'} onChange={() => setMediaFormat('comparison')} />
                                        <span className={`font-bold text-sm ${mediaFormat === 'comparison' ? 'text-black' : 'text-gray-700'}`}>Before / After</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer p-3 border rounded-lg text-center transition-colors ${mediaFormat === 'gallery' ? 'border-black bg-white shadow-sm ring-1 ring-black' : 'border-gray-200 bg-white hover:border-black'}`}>
                                        <input type="radio" name="mediaFormat" className="hidden" checked={mediaFormat === 'gallery'} onChange={() => setMediaFormat('gallery')} />
                                        <span className={`font-bold text-sm ${mediaFormat === 'gallery' ? 'text-black' : 'text-gray-700'}`}>Galeri Item</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: MEDIA UPLOADS */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span> Gambar Cover Utama (Wajib)
                            </h3>
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


                        {mediaFormat === 'gallery' && (
                            <div className="bg-violet-50/30 p-4 rounded-xl border border-violet-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span> Kelola Galeri
                                </h3>
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
