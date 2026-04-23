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
    const { showSuccess, showError } = useToast();

    const handleUpdate = (type: string, field: 'path' | 'volume', value: string | number) => {
        setLocalConfig(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: field === 'volume' ? parseFloat(value as string) : value
            }
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

    const handlePreview = useCallback((type: string, setting: { path: string, volume: number }) => {
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
    }, [showError]);

    const soundTypes = [
        { key: 'startup', label: 'Startup OS', description: 'Suara saat booting selesai.' },
        { key: 'click', label: 'Klik Desktop', description: 'Efek dasar klik pada icon/button.' },
        { key: 'window-open', label: 'Buka Window', description: 'Suara saat jendela aplikasi muncul.' },
        { key: 'window-close', label: 'Tutup Window', description: 'Suara saat jendela aplikasi ditutup.' },
        { key: 'error', label: 'Error / Alert', description: 'Peringatan sistem atau kegagalan aksi.' },
        { key: 'notification', label: 'Notifikasi', description: 'Pesan masuk atau feedback positif.' },
        { key: 'drag', label: 'Drag & Drop', description: 'Saat memindahkan icon di desktop.' },
        { key: 'typing', label: 'Chat: Mengetik', description: 'Suara tactile saat user mengetik di chat.' },
        { key: 'sent', label: 'Chat: Terkirim', description: 'Feedback suara setelah pesan terkirim.' }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Music className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800">Manajemen Efek Suara</h3>
                        <p className="text-sm text-amber-600 mt-1">
                            Atur file suara (.wav) dan volume default untuk setiap aksi sistem.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-bold shadow-lg shadow-amber-200 disabled:opacity-50"
                >
                    <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {soundTypes.map((type) => {
                    const setting = localConfig[type.key] || { path: '', volume: 0.5 };
                    return (
                        <div key={type.key} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-200 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        {type.label}
                                        <span className="text-[10px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded tracking-tighter uppercase">
                                            {type.key}
                                        </span>
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                                </div>
                                <button
                                    onClick={() => handlePreview(type.key, setting)}
                                    disabled={uploadingKey === type.key}
                                    className="p-2 bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Test Sound"
                                >
                                    {uploadingKey === type.key
                                        ? <Loader2 size={18} className="animate-spin text-amber-500" />
                                        : <Play size={18} fill="currentColor" />}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1.5 ml-1">
                                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block">Path File (.wav / .mp3)</label>
                                        <div className="relative group/upload">
                                            <button className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors">
                                                {uploadingKey === type.key
                                                    ? <><Loader2 size={10} className="animate-spin" /> Mengupload...</>
                                                    : <><Upload size={10} /> Upload Baru</>}
                                            </button>
                                            <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden z-10">
                                                <AdminFileUpload
                                                    folder="sounds"
                                                    accept="audio/*"
                                                    multiple={false}
                                                    customFilename={type.key}
                                                    onUploadStart={() => setUploadingKey(type.key)}
                                                    onUploadEnd={() => setUploadingKey(null)}
                                                    onUpload={(urls) => {
                                                        const timestamp = Date.now();
                                                        const urlWithCacheBust = `${urls[0].split('?')[0]}?v=${timestamp}`;
                                                        handleUpdate(type.key, 'path', urlWithCacheBust);
                                                        // Clear cache not available in current implementation
                                                        showSuccess(`File ${type.label} berhasil diunggah! Klik "Simpan Konfigurasi" di atas untuk menerapkan.`);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={setting.path}
                                        onChange={(e) => handleUpdate(type.key, 'path', e.target.value)}
                                        className="w-full text-xs font-mono bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
                                        placeholder="/sounds/... (.wav or .mp3)"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5 ml-1">
                                            <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block">Volume</label>
                                            <span className="text-[10px] font-bold text-amber-600">{Math.round(setting.volume * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={setting.volume}
                                            onChange={(e) => handleUpdate(type.key, 'volume', e.target.value)}
                                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200">
                <div className="flex gap-4 items-start">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Info className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">
                        <p className="font-bold text-gray-700 mb-1">Tips Konfigurasi:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Gunakan format <strong>.wav</strong> untuk performa terbaik dan latensi rendah.</li>
                            <li>Path harus diawali dengan <code className="bg-white px-1 rounded text-red-500">/</code> dan file harus ada di folder <code className="bg-white px-1 rounded text-gray-700">public/</code>.</li>
                            <li>Volume disarankan antara <strong>0.1 - 0.5</strong> agar tidak mengejutkan pengunjung.</li>
                            <li>Gunakan parameter query seperti <code className="bg-white px-1 rounded text-blue-500">?v=1.3</code> untuk memaksa browser memuat file baru (cache busting).</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
