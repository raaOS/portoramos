import { ChevronDown, FileImage } from 'lucide-react';
import { ExplorerFormatBadge } from '@/components/ui/ExplorerFormatBadge';
import { getExplorerActualFormat, getExplorerFileDisplayName } from '@/lib/utils/explorerName';
import type { ExplorerFile, ExplorerFolder } from '@/types/explorer';
import type { EventPageForm } from '../eventPageForm';

interface EventPageMediaPickerProps {
  form: EventPageForm;
  imageFiles: ExplorerFile[];
  selectedFolder?: ExplorerFolder;
  onUpdateForm: <K extends keyof EventPageForm>(key: K, value: EventPageForm[K]) => void;
  onToggleGalleryFile: (fileId: string) => void;
}

export default function EventPageMediaPicker({
  form,
  imageFiles,
  selectedFolder,
  onUpdateForm,
  onToggleGalleryFile,
}: EventPageMediaPickerProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Media dari folder</h2>
          <p className="mt-1 text-xs text-gray-500">
            {selectedFolder
              ? `${imageFiles.length} gambar tersedia di ${selectedFolder.name}`
              : 'Pilih folder untuk melihat file gambar.'}
          </p>
        </div>
        <FileImage className="h-5 w-5 text-gray-400" />
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cover</span>
        <div className="relative mt-1">
          <select
            value={form.coverFileId}
            onChange={(event) => onUpdateForm('coverFileId', event.target.value)}
            disabled={imageFiles.length === 0}
            className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
          >
            <option value="">Tanpa cover (warna solid)</option>
            {imageFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {getExplorerFileDisplayName(file)} - {getExplorerActualFormat(file)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
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
                onChange={(event) => onUpdateForm('headerColor', event.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5"
              />
              <input
                type="text"
                value={form.headerColor}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(value)) {
                    onUpdateForm('headerColor', value);
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
        {imageFiles.map((file) => (
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
              onChange={() => onToggleGalleryFile(file.id)}
              className="mt-3"
            />
            <img
              src={file.thumbnailUrl || file.url}
              alt={getExplorerFileDisplayName(file)}
              className="h-14 w-16 rounded-md object-cover"
            />
            <span className="min-w-0 flex-1 pt-2 text-xs font-medium text-gray-700">
              <span className="block truncate">{getExplorerFileDisplayName(file)}</span>
              <ExplorerFormatBadge format={getExplorerActualFormat(file)} className="mt-1" />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
