import React, { useState, useCallback } from 'react';
import { Save, Play, Music, Info, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { SoundConfig } from '@/types/about';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';

interface SoundEffectsManagerProps {
  config: SoundConfig;
  onUpdate: (config: SoundConfig) => void;
}

export default function SoundEffectsManager({ config, onUpdate }: SoundEffectsManagerProps) {
  const [localConfig, setLocalConfig] = useState<SoundConfig>(config || {});
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { showSuccess, showError } = useToast();

  const handleUpdate = (type: string, field: 'path' | 'volume', value: string | number) => {
    setLocalConfig((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: field === 'volume' ? parseFloat(value as string) : value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(localConfig);
      showSuccess('Konfigurasi suara berhasil disimpan.');
    } catch {
      showError('Gagal menyimpan konfigurasi suara.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = useCallback(
    (type: string, setting: { path: string; volume: number }) => {
      try {
        // Strip any old cache-bust param and add a fresh one so the browser
        // always loads the latest uploaded file instead of a stale cached version.
        const basePath = setting.path.split('?')[0];
        const freshPath = `${basePath}?v=${Date.now()}`;
        const audio = new Audio(freshPath);
        audio.volume = setting.volume;
        audio.play().catch((err: Error) => {
          showError('Gagal memutar suara preview: ' + err.message);
        });
      } catch {
        showError('Path suara tidak valid.');
      }
    },
    [showError]
  );

  const soundTypes = [
    { key: 'startup', label: 'Startup OS', description: 'Suara saat booting selesai.' },
    { key: 'click', label: 'Klik Desktop', description: 'Efek dasar klik pada icon/button.' },
    {
      key: 'window-open',
      label: 'Buka Window',
      description: 'Suara saat jendela aplikasi muncul.',
    },
    {
      key: 'window-close',
      label: 'Tutup Window',
      description: 'Suara saat jendela aplikasi ditutup.',
    },
    { key: 'error', label: 'Error / Alert', description: 'Peringatan sistem atau kegagalan aksi.' },
    { key: 'notification', label: 'Notifikasi', description: 'Pesan masuk atau feedback positif.' },
    { key: 'drag', label: 'Drag & Drop', description: 'Saat memindahkan icon di desktop.' },
    {
      key: 'typing',
      label: 'Chat: Mengetik',
      description: 'Suara tactile saat user mengetik di chat.',
    },
    { key: 'sent', label: 'Chat: Terkirim', description: 'Feedback suara setelah pesan terkirim.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800">Manajemen Efek Suara</h3>
            <p className="mt-1 text-sm text-amber-600">
              Atur file suara (.wav) dan volume default untuk setiap aksi sistem.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {soundTypes.map((type) => {
          const setting = localConfig[type.key] || { path: '', volume: 0.5 };
          const currentProgress = uploadProgress[type.key];
          return (
            <div
              key={type.key}
              className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-amber-200"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-gray-800">
                    {type.label}
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-tighter text-gray-400">
                      {type.key}
                    </span>
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-400">{type.description}</p>
                </div>
                <button
                  onClick={() => handlePreview(type.key, setting)}
                  disabled={uploadingKey === type.key}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-50 p-2 text-gray-400 transition-all hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Test Sound"
                >
                  {uploadingKey === type.key ? (
                    <Loader2 size={18} className="animate-spin text-amber-500" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 ml-1 flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-300">
                      Path File (.wav / .mp3)
                    </label>
                    <div className="group/upload relative">
                      <button className="flex items-center gap-1 text-[10px] font-bold text-amber-600 transition-colors hover:text-amber-700">
                        {uploadingKey === type.key ? (
                          <>
                            <Loader2 size={10} className="animate-spin" /> {currentProgress ?? 0}%
                          </>
                        ) : (
                          <>
                            <Upload size={10} /> Upload Baru
                          </>
                        )}
                      </button>
                      <div className="absolute inset-0 z-10 cursor-pointer overflow-hidden opacity-0">
                        <AdminFileUpload
                          folder="sounds"
                          accept="audio/*"
                          multiple={false}
                          customFilename={type.key}
                          onUploadStart={() => {
                            setUploadingKey(type.key);
                            setUploadProgress((prev) => ({ ...prev, [type.key]: 0 }));
                          }}
                          onUploadProgress={(progress) => {
                            setUploadProgress((prev) => ({ ...prev, [type.key]: progress }));
                          }}
                          onUploadEnd={() => {
                            setUploadingKey(null);
                            window.setTimeout(() => {
                              setUploadProgress((prev) => {
                                const next = { ...prev };
                                delete next[type.key];
                                return next;
                              });
                            }, 800);
                          }}
                          onUpload={(urls) => {
                            const timestamp = Date.now();
                            const urlWithCacheBust = `${urls[0].split('?')[0]}?v=${timestamp}`;
                            handleUpdate(type.key, 'path', urlWithCacheBust);
                            // Clear cache not available in current implementation
                            showSuccess(
                              `File ${type.label} berhasil diunggah! Klik "Simpan Konfigurasi" di atas untuk menerapkan.`
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {currentProgress !== undefined && (
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-amber-100">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-200"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={setting.path}
                    onChange={(e) => handleUpdate(type.key, 'path', e.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 font-mono text-xs transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="/sounds/... (.wav or .mp3)"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="mb-1.5 ml-1 flex items-center justify-between">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-300">
                        Volume
                      </label>
                      <span className="text-[10px] font-bold text-amber-600">
                        {Math.round(setting.volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={setting.volume}
                      onChange={(e) => handleUpdate(type.key, 'volume', e.target.value)}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-white p-2 shadow-sm">
            <Info className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-xs leading-relaxed text-gray-500">
            <p className="mb-1 font-bold text-gray-700">Tips Konfigurasi:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Gunakan format <strong>.wav</strong> untuk performa terbaik dan latensi rendah.
              </li>
              <li>
                Path harus diawali dengan{' '}
                <code className="rounded bg-white px-1 text-red-500">/</code> dan file harus ada di
                folder <code className="rounded bg-white px-1 text-gray-700">public/</code>.
              </li>
              <li>
                Volume disarankan antara <strong>0.1 - 0.5</strong> agar tidak mengejutkan
                pengunjung.
              </li>
              <li>
                Gunakan parameter query seperti{' '}
                <code className="rounded bg-white px-1 text-blue-500">?v=1.3</code> untuk memaksa
                browser memuat file baru (cache busting).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
