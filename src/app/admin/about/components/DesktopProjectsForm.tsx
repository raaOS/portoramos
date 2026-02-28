import React, { useState } from 'react';
import { Project } from '@/types/projects';
import { Grid, Check, Folder, MousePointer2 } from 'lucide-react';

interface DesktopPreferences {
    visibleProjectIds: string[];
    maxIcons: number;
    layout: 'grid' | 'scattered';
}

interface DesktopProjectsFormProps {
    data?: DesktopPreferences;
    projects: Project[];
    onUpdate: (data: DesktopPreferences) => void;
}

export default function DesktopProjectsForm({ data, projects, onUpdate }: DesktopProjectsFormProps) {
    const [preferences, setPreferences] = useState<DesktopPreferences>({
        visibleProjectIds: [],
        maxIcons: 5,
        layout: 'grid'
    });

    // Sync state with props in render
    const [lastData, setLastData] = useState(data);
    if (data && data !== lastData) {
        setPreferences({
            visibleProjectIds: data.visibleProjectIds || [],
            maxIcons: data.maxIcons || 5,
            layout: data.layout || 'grid'
        });
        setLastData(data);
    }

    const updatePrefs = (updates: Partial<DesktopPreferences>) => {
        const newData = { ...preferences, ...updates };
        setPreferences(newData);
        onUpdate(newData);
    };

    const toggleProject = (id: string) => {
        const current = preferences.visibleProjectIds;
        let newIds;
        if (current.includes(id)) {
            newIds = current.filter(pid => pid !== id);
        } else {
            if (current.length >= preferences.maxIcons) {
                // Shake effect or toast could go here
                return;
            }
            newIds = [...current, id];
        }
        updatePrefs({ visibleProjectIds: newIds });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Desktop Icons</h3>
                    <p className="text-sm text-gray-600">
                        Pilih project yang akan muncul di Desktop OS. Max {preferences.maxIcons} icons.
                    </p>
                </div>

                {/* Configuration Panel (Right Side) */}
                <div className="flex flex-col gap-3 items-end">
                    {/* Layout Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => updatePrefs({ layout: 'grid' })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${preferences.layout === 'grid'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Grid size={14} />
                            Auto Grid
                        </button>
                        <button
                            onClick={() => updatePrefs({ layout: 'scattered' })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${preferences.layout === 'scattered'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <MousePointer2 size={14} />
                            Scattered
                        </button>
                    </div>

                    {/* Max Icons Slider */}
                    <div className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Limit</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={preferences.maxIcons}
                            onChange={(e) => updatePrefs({ maxIcons: parseInt(e.target.value) })}
                            className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs font-mono font-bold w-4 text-center">{preferences.maxIcons}</span>
                    </div>
                </div>
            </div>

            {/* Visual Project Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map(p => {
                    const isSelected = preferences.visibleProjectIds.includes(p.id);
                    const isDisabled = !isSelected && preferences.visibleProjectIds.length >= preferences.maxIcons;

                    return (
                        <button
                            key={p.id}
                            onClick={() => toggleProject(p.id)}
                            disabled={isDisabled}
                            className={`
                                group relative aspect-square rounded-2xl border-2 border-transparent transition-all duration-200 flex flex-col items-center justify-center gap-4 p-4
                                ${isSelected
                                    ? 'scale-[1.02]'
                                    : isDisabled
                                        ? 'opacity-50 cursor-not-allowed grayscale'
                                        : 'hover:-translate-y-1'
                                }
                            `}
                        >
                            {/* Selected Badge */}
                            {isSelected && (
                                <div className="absolute top-4 right-4 bg-blue-500 text-white p-1.5 rounded-full shadow-lg z-10 animate-in zoom-in duration-200">
                                    <Check size={14} strokeWidth={4} />
                                </div>
                            )}

                            {/* Folder Icon Visualization */}
                            <div className="relative w-full flex-1 aspect-[1.15/1]">
                                {/* Inner Content (Preview) */}
                                <div className="absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
                                    {p.cover ? (
                                        p.cover.match(/\.(mp4|webm)$/i) ? (
                                            <video
                                                src={p.cover}
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={p.cover} className="w-full h-full object-cover" alt="" />
                                        )
                                    ) : (
                                        <Folder size={48} className="text-blue-300" />
                                    )}
                                </div>

                                {/* Front Plate (Glassy effect) - Optional: making it subtler or removing if user wants simple */}
                                <div className={`absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/5 to-transparent rounded-b-xl pointer-events-none`} />
                            </div>

                            {/* Label */}
                            <div className="w-full text-center px-2">
                                <p className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-black'}`}>
                                    {p.title}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider truncate mt-1">
                                    {p.client}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
