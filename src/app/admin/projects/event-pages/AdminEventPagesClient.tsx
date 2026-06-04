'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileImage,
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
import { ExplorerFormatBadge } from '@/components/ui/ExplorerFormatBadge';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import { getExplorerActualFormat, getExplorerFileDisplayName } from '@/lib/utils/explorerName';
import type { AnyExplorerNode, ExplorerFile, ExplorerFolder } from '@/types/explorer';
import type { EventPage, EventPageSection, EventPageStatus } from '@/types/event-page';

type EventPageForm = {
  id?: string;
  folderId: string;
  title: string;
  subtitle: string;
  role: string;
  description: string;
  status: EventPageStatus;
  coverFileId: string;
  headerColor: string;
  galleryFileIds: string[];
  sections: EventPageSection[];
};

const emptyForm = (folderId = ''): EventPageForm => ({
  folderId,
  title: '',
  subtitle: '',
  role: '',
  description: '',
  status: 'published',
  coverFileId: '',
  headerColor: '#0f172a',
  galleryFileIds: [],
  sections: [],
});

function makeSectionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function pageToForm(page: EventPage): EventPageForm {
  return {
    id: page.id,
    folderId: page.folderId,
    title: page.title,
    subtitle: page.subtitle || '',
    role: page.role || '',
    description: page.description,
    status: page.status,
    coverFileId: page.coverFileId || '',
    headerColor: page.headerColor || '#0f172a',
    galleryFileIds: page.galleryFileIds || [],
    sections: page.sections || [],
  };
}

export default function AdminEventPagesClient() {
  const [pages, setPages] = useState<EventPage[]>([]);
  const [nodes, setNodes] = useState<AnyExplorerNode[]>([]);
  const [form, setForm] = useState<EventPageForm>(emptyForm());
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
        .sort((a, b) =>
          getExplorerFileDisplayName(a).localeCompare(getExplorerFileDisplayName(b))
        ),
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
        if (refreshed) setForm(pageToForm(refreshed));
      } else if (nextPages[0]) {
        setSelectedPageId(nextPages[0].id);
        setForm(pageToForm(nextPages[0]));
      } else if (!formFolderIdRef.current) {
        const eventFolder = nextNodes.find(
          (node: AnyExplorerNode) =>
            node.type === 'folder' && /event\s+kampus\s+merdeka/i.test(node.name)
        );
        setForm(emptyForm(eventFolder?.id || ''));
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
    setForm(pageToForm(page));
  };

  const createNewPage = () => {
    const eventFolder = folders.find((folder) => /event\s+kampus\s+merdeka/i.test(folder.name));
    setSelectedPageId(null);
    setForm(emptyForm(eventFolder?.id || folders[0]?.id || ''));
  };

  const updateForm = <K extends keyof EventPageForm>(key: K, value: EventPageForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFolderChange = (folderId: string) => {
    const existingPage = pages.find((page) => page.folderId === folderId);

    if (existingPage) {
      setSelectedPageId(existingPage.id);
      setForm(pageToForm(existingPage));
      return;
    }

    setSelectedPageId(null);
    setForm(emptyForm(folderId));
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
          id: makeSectionId(),
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
      setForm(emptyForm(folders[0]?.id || ''));
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
            <aside className="rounded-lg border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Daftar event page</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Satu folder Explorer hanya punya satu landing page.
                </p>
              </div>
              <div className="max-h-[560px] overflow-y-auto p-2">
                {pages.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Belum ada event page.
                  </div>
                ) : (
                  pagesWithFolderName.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => selectPage(page)}
                      className={`mb-2 block w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        form.id === page.id
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {page.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            page.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {page.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {page.folderName || page.folderId}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="space-y-6">
              <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Folder Explorer
                    </span>
                    <select
                      value={form.folderId}
                      onChange={(event) => handleFolderChange(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Pilih folder</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm('status', event.target.value as EventPageStatus)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Judul
                    </span>
                    <input
                      value={form.title}
                      onChange={(event) => updateForm('title', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Event Kampus Merdeka"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Subtitle
                    </span>
                    <input
                      value={form.subtitle}
                      onChange={(event) => updateForm('subtitle', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Dokumentasi desain, persiapan, dan acara"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Peran / fokus
                    </span>
                    <input
                      value={form.role}
                      onChange={(event) => updateForm('role', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Desain kebutuhan event, dokumentasi visual, dan publikasi progres"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Deskripsi landing page
                    </span>
                    <textarea
                      value={form.description}
                      onChange={(event) => updateForm('description', event.target.value)}
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Ceritakan ringkas konteks event, pekerjaan yang dibuat, dan hasil dokumentasinya."
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Media dari folder</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedFolder
                        ? `${imageFilesInFolder.length} gambar tersedia di ${selectedFolder.name}`
                        : 'Pilih folder untuk melihat file gambar.'}
                    </p>
                  </div>
                  <FileImage className="h-5 w-5 text-gray-400" />
                </div>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cover
                  </span>
                  <select
                    value={form.coverFileId}
                    onChange={(event) => updateForm('coverFileId', event.target.value)}
                    disabled={imageFilesInFolder.length === 0}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
                  >
                    <option value="">Tanpa cover (warna solid)</option>
                    {imageFilesInFolder.map((file) => (
                      <option key={file.id} value={file.id}>
                        {getExplorerFileDisplayName(file)} - {getExplorerActualFormat(file)}
                      </option>
                    ))}
                  </select>
                </label>

                {!form.coverFileId && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="block flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Warna header
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={form.headerColor}
                          onChange={(event) => updateForm('headerColor', event.target.value)}
                          className="h-9 w-12 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5"
                        />
                        <input
                          type="text"
                          value={form.headerColor}
                          onChange={(event) => {
                            const val = event.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                              updateForm('headerColor', val);
                            }
                          }}
                          maxLength={7}
                          className="w-24 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="#0f172a"
                        />
                        <div
                          className="h-9 flex-1 rounded-lg border border-gray-200"
                          style={{ backgroundColor: form.headerColor }}
                        />
                      </div>
                    </label>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {imageFilesInFolder.map((file) => (
                    <label
                      key={file.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-2 transition-colors ${
                        form.galleryFileIds.includes(file.id)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.galleryFileIds.includes(file.id)}
                        onChange={() => toggleGalleryFile(file.id)}
                        className="mt-3"
                      />
                      <img
                        src={file.thumbnailUrl || file.url}
                        alt={getExplorerFileDisplayName(file)}
                        className="h-14 w-16 rounded-md object-cover"
                      />
                      <span className="min-w-0 flex-1 pt-2 text-xs font-medium text-gray-700">
                        <span className="block truncate">{getExplorerFileDisplayName(file)}</span>
                        <ExplorerFormatBadge
                          format={getExplorerActualFormat(file)}
                          className="mt-1"
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Section storytelling</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Section tampil berurutan di mini landing page.
                    </p>
                  </div>
                  <AdminButton variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addSection}>
                    Section
                  </AdminButton>
                </div>

                <div className="space-y-4">
                  {form.sections.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                      Belum ada section.
                    </div>
                  ) : (
                    form.sections.map((section, index) => (
                      <div key={section.id} className="rounded-lg border border-gray-100 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                            Section {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSection(section.id)}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Hapus section"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                          <input
                            value={section.title}
                            onChange={(event) =>
                              updateSection(section.id, 'title', event.target.value)
                            }
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Judul section"
                          />
                          <textarea
                            value={section.body}
                            onChange={(event) =>
                              updateSection(section.id, 'body', event.target.value)
                            }
                            rows={3}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Isi cerita section"
                          />
                        </div>

                        {imageFilesInFolder.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {imageFilesInFolder.map((file) => (
                              <button
                                key={file.id}
                                type="button"
                                onClick={() => toggleSectionImage(section.id, file.id)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  section.imageFileIds.includes(file.id)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {getExplorerFileDisplayName(file)} - {getExplorerActualFormat(file)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-gray-100 bg-white/90 py-4 backdrop-blur">
                {form.id && (
                  <AdminButton variant="danger" icon={<Trash2 size={16} />} onClick={deletePage}>
                    Hapus
                  </AdminButton>
                )}
                <AdminButton
                  variant="primary"
                  icon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
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
