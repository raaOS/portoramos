import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { RunningTextItem } from '@/types/runningText';
import StatusToggle from '../../components/StatusToggle';
import { useConfirm } from '@/components/admin/ConfirmDialog';

// Running Text Panel
export default function RunningTextPanel({
  items,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  items: RunningTextItem[];
  loading: boolean;
  onCreate: (data: { text: string; order?: number; isActive?: boolean }) => void;
  onUpdate: (id: string, data: Partial<RunningTextItem>) => void;
  onDelete: (id: string) => void;
}) {
  const { confirm } = useConfirm();
  const [form, setForm] = useState({
    text: '',
    order: '' as string | number,
    isActive: true,
  });

  const sortedItems = items.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      text: form.text,
      order: form.order === '' ? undefined : Number(form.order),
      isActive: form.isActive,
    });
    setForm({ text: '', order: '', isActive: true });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">Tambah Running Text</h3>
        <p className="mb-4 text-sm text-gray-600">Teks yang akan berjalan dari kanan ke kiri.</p>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 md:gap-6"
        >
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Teks</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Contoh: OPEN FOR WORK"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Urutan (opsional)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              placeholder={`${items.length + 1}`}
            />
          </div>
          <div className="flex items-center space-y-1 pt-6">
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Aktifkan</span>
            </label>
          </div>
          <div className="flex items-end justify-end md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
            >
              Tambah
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-medium text-gray-900">Daftar Running Text</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : sortedItems.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada running text. Tambahkan di atas.</p>
        ) : (
          <div className="space-y-4">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{item.text}</span>
                  </div>
                  <div className="text-xs text-gray-500">Order: {item.order}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <StatusToggle
                      isActive={item.isActive !== false}
                      onClick={() => onUpdate(item.id, { isActive: !item.isActive })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Hapus running text?',
                        message: 'Item ini akan dihapus dari ticker.',
                        confirmText: 'Hapus',
                        cancelText: 'Batal',
                        tone: 'danger',
                      });
                      if (ok) onDelete(item.id);
                    }}
                    className="inline-flex items-center justify-center rounded p-2 text-red-600 hover:bg-red-50"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
