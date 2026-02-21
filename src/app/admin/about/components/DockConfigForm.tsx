import React, { useState, useEffect } from 'react';
import { LayoutGrid, Eye, EyeOff, Upload, Save, Pencil, Image as ImageIcon } from 'lucide-react';
import IconPickerModal from './IconPickerModal';

interface DockItemConfig {
    label?: string;
    iconUrl?: string;
    isHidden?: boolean;
}

interface DockPreferences {
    [key: string]: DockItemConfig;
}

interface DockConfigFormProps {
    data?: DockPreferences;
    onUpdate: (data: DockPreferences) => void;
}

const DEFAULT_DOCK_ITEMS = [
    { id: "about", defaultLabel: "About Me" },
    { id: "projects", defaultLabel: "Projects" },
    { id: "contact", defaultLabel: "Contact" },
    { id: "gallery", defaultLabel: "Photos" },
    { id: "whatsapp", defaultLabel: "WhatsApp" },
    { id: "notes", defaultLabel: "Notes" },
    { id: "trash", defaultLabel: "Trash" },
];

export default function DockConfigForm({ data, onUpdate }: DockConfigFormProps) {
    const [preferences, setPreferences] = useState<DockPreferences>({});
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const isInitialMount = React.useRef(true);
    const lastSavedData = React.useRef<string>('');

    // Sync state with props in useEffect to avoid ref access during render
    useEffect(() => {
        if (data && isInitialMount.current) {
            requestAnimationFrame(() => setPreferences(data));
            lastSavedData.current = JSON.stringify(data);
        }
    }, [data]);

    // Debounced Save
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const currentString = JSON.stringify(preferences);
        if (currentString === lastSavedData.current) return; // No changes

        const handler = setTimeout(() => {
            onUpdate(preferences);
            lastSavedData.current = currentString;
        }, 1000); // 1 second debounce

        return () => {
            clearTimeout(handler);
        };
    }, [preferences, onUpdate]);

    const handleUpdateItem = (id: string, updates: Partial<DockItemConfig>) => {
        const newPreferences = {
            ...preferences,
            [id]: { ...(preferences[id] || {}), ...updates }
        };
        setPreferences(newPreferences);
    };

    const handleOpenPicker = (id: string) => {
        setActiveItemId(id);
        setIsPickerOpen(true);
    };

    const handleSelectIcon = (url: string) => {
        if (activeItemId) {
            handleUpdateItem(activeItemId, { iconUrl: url });
            setIsPickerOpen(false);
            setActiveItemId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Dock Configuration</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Klik ikon untuk mengganti. Perubahan disimpan secara otomatis (Auto-Save).
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {DEFAULT_DOCK_ITEMS.map((item) => {
                        const config = preferences[item.id] || {};
                        const label = config.label || item.defaultLabel;
                        const isHidden = config.isHidden || false;

                        return (
                            <div
                                key={item.id}
                                className={`
                                    relative p-4 rounded-2xl border transition-all duration-200 group
                                    ${isHidden
                                        ? 'bg-gray-50 border-gray-100 opacity-60 grayscale-[0.5]'
                                        : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200'
                                    }
                                `}
                            >
                                {/* Visibility Toggle (Top Right) */}
                                <button
                                    onClick={() => handleUpdateItem(item.id, { isHidden: !isHidden })}
                                    className={`absolute top-3 right-3 p-1.5 rounded-full transition-all z-10
                                        ${isHidden
                                            ? 'text-gray-400 hover:text-gray-600 bg-gray-100'
                                            : 'text-gray-300 hover:text-blue-500 hover:bg-gray-50 opacity-0 group-hover:opacity-100'
                                        }
                                    `}
                                    title={isHidden ? "Show in Dock" : "Hide from Dock"}
                                >
                                    {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>

                                <div className="flex flex-col items-center text-center gap-3 pt-2">
                                    {/* Large Icon Preview */}
                                    <button
                                        onClick={() => handleOpenPicker(item.id)}
                                        className="relative w-20 h-20 rounded-[22px] overflow-hidden group/icon focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-transform active:scale-95"
                                    >
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                            {config.iconUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={config.iconUrl}
                                                    alt={label}
                                                    className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover/icon:scale-110"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 opacity-20 text-gray-500">
                                                    <ImageIcon size={24} />
                                                    <span className="text-[9px] font-black uppercase tracking-tighter">{item.id.slice(0, 3)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Overlay */}
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/icon:opacity-100 flex items-center justify-center transition-all duration-200">
                                            <Pencil size={20} className="text-white drop-shadow-md scale-90 group-hover/icon:scale-100 transition-transform" />
                                        </div>
                                    </button>

                                    {/* Label Input */}
                                    <div className="w-full space-y-1">
                                        <input
                                            type="text"
                                            value={label}
                                            onChange={(e) => handleUpdateItem(item.id, { label: e.target.value })}
                                            className="w-full text-center text-sm font-semibold bg-transparent border-none p-0 focus:ring-0 hover:text-blue-600 placeholder-gray-300 transition-colors cursor-text"
                                            placeholder="Label"
                                        />
                                        <div className="h-0.5 w-8 bg-gray-100 mx-auto rounded-full group-hover:bg-blue-100 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Icon Picker Modal */}
            <IconPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleSelectIcon}
                currentIcon={activeItemId ? preferences[activeItemId]?.iconUrl : undefined}
            />
        </div >
    );
}
