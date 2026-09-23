'use client';

import { useState, useRef, useEffect } from 'react';
import { useStorageUpload } from '@/app/admin/components/file-upload/hooks/useStorageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { getProxiedUrl } from '@/lib/utils';
import type { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import type { ProjectFormData } from '@/hooks/useProjectForm';

interface UseProjectFormUploadsOptions {
  project?: Project;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
  getSubmitData: () => CreateProjectData | UpdateProjectData | null;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
  onCancel: () => void;
}

export function useProjectFormUploads({
  project,
  updateField,
  getSubmitData,
  onSubmit,
  onCancel,
}: UseProjectFormUploadsOptions) {
  const { csrfToken } = useAdminAuth();
  const { upload } = useStorageUpload({ folder: 'projects', csrfToken: csrfToken || '' });
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();

  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(
    project?.cover ? getProxiedUrl(project.cover) : null
  );

  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

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

  const handlePdfSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError('Harap pilih file berekstensi .pdf untuk dokumen project.');
      return;
    }
    setPendingPdfFile(file);
    updateField('pdfUrl', URL.createObjectURL(file));
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const submitData = getSubmitData();
    if (!submitData) {
      showError('Harap lengkapi field yang wajib diisi (Judul dan Cover Thumbnail).');
      return;
    }

    try {
      setIsSubmitting(true);

      if (pendingCoverFile) {
        setCoverUploadProgress(10);
        const { url, success, error: uploadError } = await upload(pendingCoverFile, {
          onUploadProgress: setCoverUploadProgress,
        });
        if (!success || !url) throw new Error(uploadError || 'Gagal mengunggah cover');
        submitData.cover = url;
        setCoverUploadProgress(100);
      }

      if (pendingPdfFile) {
        setPdfUploadProgress(10);
        const { url, success, error: uploadError } = await upload(pendingPdfFile, {
          onUploadProgress: setPdfUploadProgress,
        });
        if (!success || !url) throw new Error(uploadError || 'Gagal mengunggah file PDF');
        submitData.pdfUrl = url;
        setPdfUploadProgress(100);
      }

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

  return {
    pendingCoverFile,
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
  };
}
