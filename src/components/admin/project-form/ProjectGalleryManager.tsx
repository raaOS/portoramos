'use client';
/**
 * Project Gallery Manager — Pengelola gallery per proyek.
 *
 * Menangani upload, penghapusan, dan pengelompokan gambar gallery
 * untuk setiap proyek di form admin, dengan upload direct ke R2.
 *
 * @module components/admin/project-form/ProjectGalleryManager
 */

import React from 'react';
import { Plus, Image as ImageIcon, FolderPlus } from 'lucide-react';
import { useStorageUpload } from '@/app/admin/components/file-upload/hooks/useStorageUpload';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import GalleryItemComponent from './components/GalleryItem';
import GalleryGroupComponent from './components/GalleryGroup';
import { useConfirm } from '@/components/admin/ConfirmDialog';

interface ProjectGalleryManagerProps {
  formData: ProjectFormData;
  addGalleryItem: (url: string) => boolean;
  removeGalleryItem: (index: number) => void;
  toggleGalleryItem: (index: number) => void;
  addGalleryGroup: (name: string) => void;
  removeGalleryGroup: (groupId: string) => void;
  addGalleryItemToGroup: (groupId: string, url: string) => boolean;
  removeGalleryItemFromGroup: (groupId: string, itemIndex: number) => void;
  toggleGalleryItemInGroup: (groupId: string, itemIndex: number) => void;
  updateGroupName: (groupId: string, name: string) => void;
  onNewUpload?: (url: string) => void;
}

export default function ProjectGalleryManager(props: ProjectGalleryManagerProps) {
  const { csrfToken } = useAdminAuth();
  const { upload } = useStorageUpload({ folder: 'projects', csrfToken: csrfToken || '' });
  const { prompt } = useConfirm();
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);

  const finishProgress = () => {
    setUploadProgress(100);
    window.setTimeout(() => setUploadProgress(null), 800);
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      const { url, success } = await upload(file, { onUploadProgress: setUploadProgress });
      if (success) {
        props.addGalleryItem(url);
        props.onNewUpload?.(url);
        finishProgress();
      } else {
        setUploadProgress(null);
      }
    } finally {
      e.target.value = '';
    }
  };

  const handleGroupUpload = async (groupId: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadProgress(0);
    const { url, success } = await upload(file, { onUploadProgress: setUploadProgress });
    if (success) {
      props.addGalleryItemToGroup(groupId, url);
      props.onNewUpload?.(url);
      finishProgress();
    } else {
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100">
          <Plus size={16} />
          <span>{uploadProgress === null ? 'Single Item' : `Uploading ${uploadProgress}%`}</span>
          <input
            type="file"
            className="hidden"
            onChange={handleSingleUpload}
            accept="image/*,video/*"
          />
        </label>
        <button
          type="button"
          onClick={async () => {
            const name = await prompt({
              title: 'Buat grup galeri',
              message: 'Beri nama untuk grup galeri baru.',
              defaultValue: 'Grup Baru',
              placeholder: 'Nama grup',
              confirmText: 'Buat Grup',
              maxLength: 80,
            });
            if (name) props.addGalleryGroup(name);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100"
        >
          <FolderPlus size={16} />
          <span>Multiple Group</span>
        </button>
      </div>
      {uploadProgress !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Gallery Content */}
      <div className="space-y-6">
        {/* Independent Items */}
        {props.formData.galleryItems && props.formData.galleryItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {props.formData.galleryItems.map((item, index) => (
              <GalleryItemComponent
                key={`single-${index}`}
                item={item}
                onRemove={() => props.removeGalleryItem(index)}
                onToggleActive={() => props.toggleGalleryItem(index)}
              />
            ))}
          </div>
        )}

        {/* Groups */}
        {props.formData.galleryGroups?.map((group, gIdx) => (
          <div key={`group-${group.id || gIdx}`} className="relative">
            <GalleryGroupComponent
              group={group}
              index={gIdx}
              onRemove={(id) => props.removeGalleryGroup(id)}
              onUpdateName={(id, name) => props.updateGroupName(id, name)}
              onAddItem={(id) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,video/*';
                input.onchange = (event: Event) => {
                  const target = event.currentTarget;
                  if (target instanceof HTMLInputElement) {
                    void handleGroupUpload(id, target.files);
                  }
                };
                input.click();
              }}
              onRemoveItem={(id, itemIdx) => props.removeGalleryItemFromGroup(id, itemIdx)}
              onToggleItemActive={(id, itemIdx) => props.toggleGalleryItemInGroup(id, itemIdx)}
            />
          </div>
        ))}

        {!props.formData.galleryItems?.length && !props.formData.galleryGroups?.length && (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30 text-gray-400">
            <ImageIcon size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium italic">Belum ada item galeri</p>
          </div>
        )}
      </div>
    </div>
  );
}
