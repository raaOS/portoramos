'use client';
/**
 * Gallery Manager — Komponen admin untuk mengelola gallery foto.
 *
 * Menampilkan grid gambar dengan kemampuan upload, hapus, dan reorder
 * menggunakan TanStack Query untuk data fetching dan caching.
 *
 * @module components/admin/GalleryManager
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Project } from '@/types/projects';
import { GalleryFeaturedData } from '@/types/gallery';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminGalleryFeatured,
} from '@/app/admin/lib/adminQueries';

interface GalleryManagerProps {
  projects: Project[];
}

export default function GalleryManager({ projects }: GalleryManagerProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { csrfToken } = useAdminAuth();

  const galleryQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.galleryFeatured,
    queryFn: fetchAdminGalleryFeatured,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.galleryFeatured,
  });

  const [prevGalleryData, setPrevGalleryData] = useState<typeof galleryQuery.data>(undefined);
  if (galleryQuery.data && galleryQuery.data !== prevGalleryData) {
    setPrevGalleryData(galleryQuery.data);
    setFeaturedIds(galleryQuery.data.featuredProjectIds || []);
  }

  useEffect(() => {
    if (galleryQuery.error) {
      console.error('Failed to fetch gallery data', galleryQuery.error);
      showError('Failed to load gallery settings');
    }
  }, [galleryQuery.error, showError]);

  const toggleSelection = (projectId: string) => {
    setFeaturedIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        if (prev.length >= 10) {
          showError('Maximum 10 items allowed');
          return prev;
        }
        return [...prev, projectId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/gallery/featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ featuredProjectIds: featuredIds }),
      });

      if (!res.ok) throw new Error('Failed to save gallery');
      queryClient.setQueryData<GalleryFeaturedData>(ADMIN_QUERY_KEYS.galleryFeatured, {
        featuredProjectIds: featuredIds,
        lastUpdated: new Date().toISOString(),
      });
      showSuccess('Gallery updated successfully!');
    } catch (error) {
      console.error(error);
      showError('Failed to save gallery');
    } finally {
      setSaving(false);
    }
  };

  if (galleryQuery.isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-violet-600" />
      </div>
    );
  }

  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const isVideoLink = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

  return (
    <div className="space-y-6">
      {/* Gallery Info */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-semibold text-blue-800">Gallery Management</h3>
          <p className="mt-1 text-sm text-blue-700">
            Pilih up to 10 project untuk tampil di &quot;About&quot; page Sticky Gallery.
          </p>
        </div>
      </div>

      {/* Save Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white py-4">
        <div className="text-sm text-gray-500">
          Selected: <span className="font-bold text-gray-900">{featuredIds.length}</span> / 10
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sortedProjects.map((project) => {
          const selectedIndex = featuredIds.indexOf(project.id);
          const isSelected = selectedIndex !== -1;
          const isVideo = isVideoLink(project.cover);

          return (
            <div
              key={project.id}
              onClick={() => toggleSelection(project.id)}
              className={`group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${isSelected ? 'scale-[1.02] border-violet-600 ring-2 ring-violet-200' : 'border-transparent hover:border-gray-300'} `}
            >
              {isVideo ? (
                <video
                  src={project.cover + '#t=0.1'}
                  className={`h-full w-full object-cover transition-all duration-300 ${isSelected ? 'brightness-100' : 'brightness-90 group-hover:brightness-100'}`}
                  muted
                  loop
                  playsInline
                  autoPlay={false}
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
              ) : (
                <Image
                  src={project.cover}
                  alt={project.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className={`object-cover transition-all duration-300 ${isSelected ? 'brightness-100' : 'brightness-90 group-hover:brightness-100'}`}
                />
              )}

              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-violet-600/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-violet-600 text-xl font-bold text-white">
                    {selectedIndex + 1}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
