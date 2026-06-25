import { Plus, Trash2 } from 'lucide-react';
import AdminButton from '@/app/admin/components/AdminButton';
import { getExplorerActualFormat, getExplorerFileDisplayName } from '@/lib/utils/explorerName';
import type { ExplorerFile } from '@/types/explorer';
import type { EventPageSection } from '@/types/event-page';

interface EventPageSectionsEditorProps {
  sections: EventPageSection[];
  imageFiles: ExplorerFile[];
  onAddSection: () => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSection: <K extends keyof EventPageSection>(
    sectionId: string,
    key: K,
    value: EventPageSection[K]
  ) => void;
  onToggleSectionImage: (sectionId: string, fileId: string) => void;
}

export default function EventPageSectionsEditor({
  sections,
  imageFiles,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onToggleSectionImage,
}: EventPageSectionsEditorProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Section storytelling</h2>
          <p className="mt-1 text-xs text-gray-500">
            Section tampil berurutan di mini landing page.
          </p>
        </div>
        <AdminButton variant="secondary" size="sm" icon={<Plus size={14} />} onClick={onAddSection}>
          Section
        </AdminButton>
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
            Belum ada section.
          </div>
        ) : (
          sections.map((section, index) => (
            <div key={section.id} className="rounded-lg border border-gray-100 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Section {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSection(section.id)}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Hapus section"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <input
                  value={section.title}
                  onChange={(event) => onUpdateSection(section.id, 'title', event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Judul section"
                />
                <textarea
                  value={section.body}
                  onChange={(event) => onUpdateSection(section.id, 'body', event.target.value)}
                  rows={3}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Isi cerita section"
                />
              </div>

              {imageFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {imageFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => onToggleSectionImage(section.id, file.id)}
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
  );
}
