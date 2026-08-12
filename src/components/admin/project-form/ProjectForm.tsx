'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProjectForm } from '@/hooks/useProjectForm';
import type { CreateProjectData, Project, UpdateProjectData } from '@/types/projects';
import type { Label } from '@/types/labels';
import { useStorageUpload } from '@/app/admin/components/file-upload/hooks/useStorageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import ProjectWindowModal from './components/ProjectWindowModal';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Loader2,
  Trash2,
  Calendar,
  Building,
  Tag,
} from 'lucide-react';
import { getProxiedUrl } from '@/lib/utils';

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

  const { csrfToken } = useAdminAuth();
  const { upload } = useStorageUpload({ folder: 'projects', csrfToken: csrfToken || '' });
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();

  // Cover Image state
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(
    project?.cover ? getProxiedUrl(project.cover) : null
  );

  // PDF File state
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (coverPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  // Handle Cover File Selection
  const handleCoverSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Harap pilih file gambar (JPG, PNG, WebP) untuk cover.');
      return;
    }
    setPendingCoverFile(file);
    const blobUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(blobUrl);
    updateField('cover', blobUrl);
  };

  // Handle PDF File Selection
  const handlePdfSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError('Harap pilih file berekstensi .pdf untuk dokumen project.');
      return;
    }
    setPendingPdfFile(file);
    updateField('pdfUrl', URL.createObjectURL(file));
  };

  // Handle Tag Selection from Labels
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

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const submitData = getSubmitData();
    if (!submitData) {
      showError('Harap lengkapi field yang wajib diisi (Judul dan Cover Thumbnail).');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload Cover Image if pending
      if (pendingCoverFile) {
        setCoverUploadProgress(10);
        const { url, success, error: uploadError } = await upload(pendingCoverFile, {
          onUploadProgress: setCoverUploadProgress,
        });
        if (!success || !url) throw new Error(uploadError || 'Gagal mengunggah cover');
        submitData.cover = url;
        setCoverUploadProgress(100);
      }

      // 2. Upload PDF file if pending
      if (pendingPdfFile) {
        setPdfUploadProgress(10);
        const { url, success, error: uploadError } = await upload(pendingPdfFile, {
          onUploadProgress: setPdfUploadProgress,
        });
        if (!success || !url) throw new Error(uploadError || 'Gagal mengunggah file PDF');
        submitData.pdfUrl = url;
        setPdfUploadProgress(100);
      }

      // 3. Submit data to backend
      await onSubmit(submitData);
      showSuccess('Project berhasil disimpan!');
      onCancel();
    } catch (err: unknown) {
      console.error('[ProjectForm] Submit failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan project.';
      showError(msg);
    } finally {
      setIsSubmitting(false);
      setCoverUploadProgress(null);
      setPdfUploadProgress(null);
    }
  };

  const handleRemovePdf = async () => {
    const ok = await confirm({
      title: 'Hapus File PDF?',
      message: 'File PDF akan dihapus dari project ini.',
      confirmText: 'Hapus PDF',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (ok) {
      setPendingPdfFile(null);
      updateField('pdfUrl', '');
    }
  };

  return (
    <ProjectWindowModal
      onClose={onCancel}
      title={title}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Simpan Project</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Project Metadata */}
          <div className="space-y-4 lg:col-span-6">
            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Judul Project <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Contoh: Redesign Aplikasi Mobile Bank"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                required
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Category / Tags */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                <Tag className="h-3.5 w-3.5" />
                <span>Kategori & Tag</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="UI/UX, Mobile App, Branding (pisahkan koma)"
                className="mb-2 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((lbl) => {
                    const isSelected = formData.tags
                      ?.split(',')
                      .map((t) => t.trim().toLowerCase())
                      .includes(lbl.slug.toLowerCase());
                    return (
                      <button
                        key={lbl.id || lbl.slug}
                        type="button"
                        onClick={() => handleToggleTag(lbl.slug)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Client & Year */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  <Building className="h-3 w-3" />
                  <span>Klien / Instansi</span>
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => updateField('client', e.target.value)}
                  placeholder="Contoh: PT. Maju Bersama"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  <Calendar className="h-3 w-3" />
                  <span>Tahun</span>
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => updateField('year', parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Deskripsi Singkat
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                placeholder="Penjelasan ringkas tentang karya/project ini..."
                className="w-full resize-none rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>

          {/* Right Column: PDF Document & Thumbnail Uploads */}
          <div className="space-y-5 lg:col-span-6">
            {/* 1. PDF Document Upload Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <FileText className="h-4 w-4" />
                  Berkas Dokumen PDF
                </span>
                {formData.pdfUrl && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    PDF Terpasang
                  </span>
                )}
              </label>

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfSelect(file);
                }}
              />

              {formData.pdfUrl ? (
                /* PDF Ready State */
                <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {pendingPdfFile ? pendingPdfFile.name : 'Dokumen PDF Project'}
                        </p>
                        {pendingPdfFile && (
                          <p className="text-[10px] text-neutral-400">
                            {(pendingPdfFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!pendingPdfFile && formData.pdfUrl && (
                        <a
                          href={getProxiedUrl(formData.pdfUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
                          title="Buka PDF di tab baru"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                        title="Hapus PDF"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {pdfUploadProgress !== null && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${pdfUploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* PDF Empty / Upload Dropzone */
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 dark:border-neutral-700 dark:bg-neutral-800/30 dark:hover:border-blue-500/50"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Klik untuk upload file PDF
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Mendukung berkas presentasi, deck, atau dokumen portofolio (.pdf)
                  </p>
                </div>
              )}
            </div>

            {/* 2. Cover / Thumbnail Upload Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" />
                  Cover / Thumbnail <span className="text-red-500">*</span>
                </span>
                {isDetectingDimensions && (
                  <span className="text-[10px] text-blue-500">Mendeteksi dimensi...</span>
                )}
              </label>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverSelect(file);
                }}
              />

              {coverPreviewUrl ? (
                /* Cover Preview State */
                <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <img
                    src={coverPreviewUrl}
                    alt="Cover preview"
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-900 shadow backdrop-blur hover:bg-white"
                    >
                      Ganti Gambar
                    </button>
                  </div>
                  {coverUploadProgress !== null && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-200">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${coverUploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Cover Empty / Upload Dropzone */
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 dark:border-neutral-700 dark:bg-neutral-800/30 dark:hover:border-blue-500/50"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-200/60 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Klik untuk upload gambar cover
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Dipakai untuk ikon folder desktop OS simulator dan kartu preview
                  </p>
                </div>
              )}
              {errors.cover && <p className="mt-1.5 text-xs text-red-500">{errors.cover}</p>}
            </div>
          </div>
        </div>
      </form>
    </ProjectWindowModal>
  );
}
