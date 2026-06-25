import { ChevronDown } from 'lucide-react';
import type { ExplorerFolder } from '@/types/explorer';
import type { EventPageStatus } from '@/types/event-page';
import type { EventPageForm } from '../eventPageForm';

interface EventPageBasicsFormProps {
  form: EventPageForm;
  folders: ExplorerFolder[];
  onFolderChange: (folderId: string) => void;
  onUpdateForm: <K extends keyof EventPageForm>(key: K, value: EventPageForm[K]) => void;
}

export default function EventPageBasicsForm({
  form,
  folders,
  onFolderChange,
  onUpdateForm,
}: EventPageBasicsFormProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Folder Explorer
          </span>
          <div className="relative mt-1">
            <select
              value={form.folderId}
              onChange={(event) => onFolderChange(event.target.value)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Pilih folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status
          </span>
          <div className="relative mt-1">
            <select
              value={form.status}
              onChange={(event) => onUpdateForm('status', event.target.value as EventPageStatus)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Judul</span>
          <input
            value={form.title}
            onChange={(event) => onUpdateForm('title', event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Event Kampus Merdeka"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Subtitle
          </span>
          <input
            value={form.subtitle}
            onChange={(event) => onUpdateForm('subtitle', event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Dokumentasi desain, persiapan, dan acara"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Peran / fokus
          </span>
          <input
            value={form.role}
            onChange={(event) => onUpdateForm('role', event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Desain kebutuhan event, dokumentasi visual, dan publikasi progres"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Deskripsi landing page
          </span>
          <textarea
            value={form.description}
            onChange={(event) => onUpdateForm('description', event.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Ceritakan ringkas konteks event, pekerjaan yang dibuat, dan hasil dokumentasinya."
          />
        </label>
      </div>
    </div>
  );
}
