import type { EventPage } from '@/types/event-page';

type EventPageWithFolderName = EventPage & {
  folderName?: string;
};

interface EventPageListProps {
  pages: EventPageWithFolderName[];
  selectedPageId?: string;
  onSelectPage: (page: EventPage) => void;
}

export default function EventPageList({
  pages,
  selectedPageId,
  onSelectPage,
}: EventPageListProps) {
  return (
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
          pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page)}
              className={`mb-2 block w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                selectedPageId === page.id
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold text-gray-900">{page.title}</span>
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
  );
}
