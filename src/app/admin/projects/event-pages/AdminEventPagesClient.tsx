'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutTemplate,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { AdminHeader } from '../../components/components/AdminHeader';
import AdminButton from '@/app/admin/components/AdminButton';
import AdminLoading from '@/components/admin/AdminLoading';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import { getExplorerFileDisplayName } from '@/lib/utils/explorerName';
import type { AnyExplorerNode, ExplorerFile, ExplorerFolder } from '@/types/explorer';
import type { EventPage, EventPageSection } from '@/types/event-page';
import EventPageBasicsForm from './components/EventPageBasicsForm';
import EventPageList from './components/EventPageList';
import EventPageMediaPicker from './components/EventPageMediaPicker';
import EventPageSectionsEditor from './components/EventPageSectionsEditor';
import {
  emptyEventPageForm,
  eventPageToForm,
  makeEventPageSectionId,
  type EventPageForm,
} from './eventPageForm';

export default function AdminEventPagesClient() {
  const [pages, setPages] = useState<EventPage[]>([]);
  const [nodes, setNodes] = useState<AnyExplorerNode[]>([]);
  const [form, setForm] = useState<EventPageForm>(emptyEventPageForm());
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const selectedPageIdRef = useRef<string | null>(null);
  const formFolderIdRef = useRef('');
  const { csrfToken } = useAdminAuth();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    selectedPageIdRef.current = selectedPageId;
  }, [selectedPageId]);

  useEffect(() => {
    formFolderIdRef.current = form.folderId;
  }, [form.folderId]);

  const folders = useMemo(
    () =>
      nodes
        .filter((node): node is ExplorerFolder => node.type === 'folder')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );

  const folderNameById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder.name])),
    [folders]
  );

  const pagesWithFolderName = useMemo(
    () =>
      pages.map((page) => ({
        ...page,
        folderName: folderNameById.get(page.folderId),
      })),
    [folderNameById, pages]
  );

  const imageFilesInFolder = useMemo(
    () =>
      nodes
        .filter(
          (node): node is ExplorerFile =>
            node.type === 'file' && node.parentId === form.folderId && node.fileType === 'image'
        )
        .sort((a, b) => getExplorerFileDisplayName(a).localeCompare(getExplorerFileDisplayName(b))),
    [form.folderId, nodes]
  );

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === form.folderId),
    [folders, form.folderId]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pagesRes, explorerRes] = await Promise.all([
        fetch(`/api/event-pages?all=true&_t=${Date.now()}`),
        fetch(`/api/explorer?all=true&_t=${Date.now()}`),
      ]);

      const [pagesPayload, explorerPayload] = await Promise.all([
        pagesRes.json(),
        explorerRes.json(),
      ]);

      if (!pagesRes.ok || !pagesPayload.success) {
        throw new Error(pagesPayload.error || 'Gagal memuat event pages');
      }
      if (!explorerRes.ok || !explorerPayload.success) {
        throw new Error(explorerPayload.error || 'Gagal memuat Explorer');
      }

      const nextPages = pagesPayload.data?.pages || [];
      const nextNodes = explorerPayload.data?.nodes || [];
      setPages(nextPages);
      setNodes(nextNodes);

      if (selectedPageIdRef.current) {
        const refreshed = nextPages.find(
          (page: EventPage) => page.id === selectedPageIdRef.current
        );
        if (refreshed) setForm(eventPageToForm(refreshed));
      } else if (nextPages[0]) {
        setSelectedPageId(nextPages[0].id);
        setForm(eventPageToForm(nextPages[0]));
      } else if (!formFolderIdRef.current) {
        const eventFolder = nextNodes.find(
          (node: AnyExplorerNode) =>
            node.type === 'folder' && /event\s+kampus\s+merdeka/i.test(node.name)
        );
        setForm(emptyEventPageForm(eventFolder?.id || ''));
      }
    } catch (error) {
      console.error('[AdminEventPages] Load failed:', error);
      showError(error instanceof Error ? error.message : 'Gagal memuat event pages');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const selectPage = (page: EventPage) => {
    setSelectedPageId(page.id);
    setForm(eventPageToForm(page));
  };

  const createNewPage = () => {
    const eventFolder = folders.find((folder) => /event\s+kampus\s+merdeka/i.test(folder.name));
    setSelectedPageId(null);
    setForm(emptyEventPageForm(eventFolder?.id || folders[0]?.id || ''));
  };

  const updateForm = <K extends keyof EventPageForm>(key: K, value: EventPageForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFolderChange = (folderId: string) => {
    const existingPage = pages.find((page) => page.folderId === folderId);

    if (existingPage) {
      setSelectedPageId(existingPage.id);
      setForm(eventPageToForm(existingPage));
      return;
    }

    setSelectedPageId(null);
    setForm(emptyEventPageForm(folderId));
  };

  const toggleGalleryFile = (fileId: string) => {
    setForm((current) => ({
      ...current,
      galleryFileIds: current.galleryFileIds.includes(fileId)
        ? current.galleryFileIds.filter((id) => id !== fileId)
        : [...current.galleryFileIds, fileId],
    }));
  };

  const addSection = () => {
    setForm((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: makeEventPageSectionId(),
          title: '',
          body: '',
          imageFileIds: [],
        },
      ],
    }));
  };

  const updateSection = <K extends keyof EventPageSection>(
    sectionId: string,
    key: K,
    value: EventPageSection[K]
  ) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, [key]: value } : section
      ),
    }));
  };

  const removeSection = (sectionId: string) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.id !== sectionId),
    }));
  };

  const toggleSectionImage = (sectionId: string, fileId: string) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          imageFileIds: section.imageFileIds.includes(fileId)
            ? section.imageFileIds.filter((id) => id !== fileId)
            : [...section.imageFileIds, fileId],
        };
      }),
    }));
  };

  const savePage = async () => {
    if (!form.folderId) {
      showError('Pilih folder event lebih dulu');
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      showError('Judul dan deskripsi wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/event-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getWritableCsrfToken(csrfToken),
        },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Gagal menyimpan event page');
      }

      setSelectedPageId(payload.data.id);
      showSuccess('Event page berhasil disimpan');
      await loadData();
    } catch (error) {
      console.error('[AdminEventPages] Save failed:', error);
      showError(error instanceof Error ? error.message : 'Gagal menyimpan event page');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async () => {
    if (!form.id) return;

    const ok = await confirm({
      title: 'Hapus event page?',
      message: 'Data landing page akan dihapus. File di Explorer dan R2 tidak ikut dihapus.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/event-pages?id=${encodeURIComponent(form.id)}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getWritableCsrfToken(csrfToken),
        },
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Gagal menghapus event page');
      }

      showSuccess('Event page berhasil dihapus');
      setSelectedPageId(null);
      setForm(emptyEventPageForm(folders[0]?.id || ''));
      await loadData();
    } catch (error) {
      console.error('[AdminEventPages] Delete failed:', error);
      showError(error instanceof Error ? error.message : 'Gagal menghapus event page');
    }
  };

  const toolbarActions = (
    <div className="flex items-center gap-2">
      <AdminButton variant="secondary" icon={<Plus size={16} />} onClick={createNewPage}>
        Page Baru
      </AdminButton>
      <AdminButton variant="ghost" onClick={loadData} disabled={isLoading}>
        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      </AdminButton>
    </div>
  );

  return (
    <>
      <AdminHeader
        title="Event Page Manager"
        titleIcon={<LayoutTemplate className="h-5 w-5" aria-hidden />}
        titleAccent="bg-cyan-50 text-cyan-700"
        actions={toolbarActions}
      />
      <div className="flex-1 space-y-6 p-6">
        {isLoading ? (
          <AdminLoading size="page" />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <EventPageList
              pages={pagesWithFolderName}
              selectedPageId={form.id}
              onSelectPage={selectPage}
            />

            <section className="space-y-6">
              <EventPageBasicsForm
                form={form}
                folders={folders}
                onFolderChange={handleFolderChange}
                onUpdateForm={updateForm}
              />

              <EventPageMediaPicker
                form={form}
                imageFiles={imageFilesInFolder}
                selectedFolder={selectedFolder}
                onUpdateForm={updateForm}
                onToggleGalleryFile={toggleGalleryFile}
              />

              <EventPageSectionsEditor
                sections={form.sections}
                imageFiles={imageFilesInFolder}
                onAddSection={addSection}
                onRemoveSection={removeSection}
                onUpdateSection={updateSection}
                onToggleSectionImage={toggleSectionImage}
              />

              <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-gray-100 bg-white/90 py-4 backdrop-blur">
                {form.id && (
                  <AdminButton variant="danger" icon={<Trash2 size={16} />} onClick={deletePage}>
                    Hapus
                  </AdminButton>
                )}
                <AdminButton
                  variant="primary"
                  icon={
                    isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />
                  }
                  onClick={savePage}
                  disabled={isSaving}
                >
                  Simpan
                </AdminButton>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
