import { useState } from 'react';
import { CreateProjectData, Project } from '@/types/projects';
import { extractStoragePath } from '@/lib/media';
import { useConfirm } from '@/components/admin/ConfirmDialog';

export function useProjectPurge(project?: Project, csrfToken?: string | null) {
  const [sessionUploads, setSessionUploads] = useState<string[]>([]);
  const { confirm } = useConfirm();

  const trackNewUpload = (url: string) => {
    setSessionUploads((prev) => [...prev, url]);
  };

  const purgeUrl = async (url: string) => {
    try {
      const path = extractStoragePath(url);
      if (path && !url.startsWith('blob:')) {
        const response = await fetch(`/api/admin/upload?path=${encodeURIComponent(path)}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'x-csrf-token': csrfToken || '',
          },
        });
        if (!response.ok) {
          throw new Error(`Delete failed with status ${response.status}`);
        }
      }
    } catch (e) {
      console.error('Purge failed for', url, e);
    }
  };

  const getAllUrls = (data: Partial<CreateProjectData>) => {
    const urls = new Set<string>();
    if (data.cover) urls.add(data.cover);
    if (data.comparison?.beforeImage) urls.add(data.comparison.beforeImage);
    if (data.comparison?.afterImage) urls.add(data.comparison.afterImage);
    data.galleryItems?.forEach((item) => urls.add(item.src));
    data.galleryGroups?.forEach((g) => g.items.forEach((item) => urls.add(item.src)));
    return urls;
  };

  const executeCleanup = async (submitData: Partial<CreateProjectData>) => {
    const usedUrls = getAllUrls(submitData);
    const originalUrls = project
      ? getAllUrls(project as unknown as CreateProjectData)
      : new Set<string>();

    // 1. Ghost session uploads (uploaded in this session, but replaced/removed before submit)
    const ghostSessionUrls = sessionUploads.filter((url) => !usedUrls.has(url));
    // 2. Removed original uploads (existed before, removed during edit)
    const removedOriginalUrls = Array.from(originalUrls).filter((url) => !usedUrls.has(url));

    const urlsToPurge = [...ghostSessionUrls, ...removedOriginalUrls];

    if (urlsToPurge.length > 0) {
      await Promise.allSettled(urlsToPurge.map(purgeUrl));
    }
  };

  const handleCancelCleanup = async () => {
    if (sessionUploads.length > 0) {
      const ok = await confirm({
        title: 'Batalkan dan hapus upload?',
        message:
          'Membatalkan form akan menghapus permanen semua file ' +
          'media baru yang sudah kamu upload di sesi ini. Lanjutkan?',
        confirmText: 'Hapus & Tutup',
        cancelText: 'Lanjut Edit',
        tone: 'danger',
      });
      if (!ok) return false;

      await Promise.allSettled(sessionUploads.map(purgeUrl));
    }
    return true;
  };

  return { trackNewUpload, executeCleanup, handleCancelCleanup, purgeUrl };
}
