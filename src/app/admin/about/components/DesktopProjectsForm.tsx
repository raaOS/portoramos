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

export default function DesktopProjectsForm({
  data,
  projects,
  onUpdate,
}: DesktopProjectsFormProps) {
  const [preferences, setPreferences] = useState<DesktopPreferences>({
    visibleProjectIds: [],
    maxIcons: 5,
    layout: 'grid',
  });

  // Sync state with props in render
  const [lastData, setLastData] = useState(data);
  if (data && data !== lastData) {
    setPreferences({
      visibleProjectIds: data.visibleProjectIds || [],
      maxIcons: data.maxIcons || 5,
      layout: data.layout || 'grid',
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
      newIds = current.filter((pid) => pid !== id);
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
          <h3 className="mb-2 text-lg font-medium text-gray-900">Desktop Icons</h3>
          <p className="text-sm text-gray-600">
            Pilih project yang akan muncul di Desktop OS. Max {preferences.maxIcons} icons.
          </p>
        </div>

        {/* Configuration Panel (Right Side) */}
        <div className="flex flex-col items-end gap-3">
          {/* Layout Toggle */}
          <div className="flex items-center rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => updatePrefs({ layout: 'grid' })}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                preferences.layout === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid size={14} />
              Auto Grid
            </button>
            <button
              onClick={() => updatePrefs({ layout: 'scattered' })}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                preferences.layout === 'scattered'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MousePointer2 size={14} />
              Scattered
            </button>
          </div>

          {/* Max Icons Slider */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-gray-400">Limit</span>
            <input
              type="range"
              min="1"
              max="10"
              value={preferences.maxIcons}
              onChange={(e) => updatePrefs({ maxIcons: parseInt(e.target.value) })}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
            />
            <span className="w-4 text-center font-mono text-xs font-bold">
              {preferences.maxIcons}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Project Grid */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
        {projects.map((p) => {
          const isSelected = preferences.visibleProjectIds.includes(p.id);
          const isDisabled =
            !isSelected && preferences.visibleProjectIds.length >= preferences.maxIcons;

          return (
            <button
              key={p.id}
              onClick={() => toggleProject(p.id)}
              disabled={isDisabled}
              className={`group relative flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl border-2 border-transparent p-4 transition-all duration-200 ${
                isSelected
                  ? 'scale-[1.02]'
                  : isDisabled
                    ? 'cursor-not-allowed opacity-50 grayscale'
                    : 'hover:-translate-y-1'
              } `}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="animate-in zoom-in absolute right-4 top-4 z-10 rounded-full bg-blue-500 p-1.5 text-white shadow-lg duration-200">
                  <Check size={14} strokeWidth={4} />
                </div>
              )}

              {/* Folder Icon Visualization */}
              <div className="relative aspect-[1.15/1] w-full flex-1">
                {/* Inner Content (Preview) */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                  {p.cover ? (
                    p.cover.match(/\.(mp4|webm)$/i) ? (
                      <video
                        src={p.cover}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={p.cover} className="h-full w-full object-cover" alt="" />
                    )
                  ) : (
                    <Folder size={48} className="text-blue-300" />
                  )}
                </div>

                {/* Front Plate (Glassy effect) - Optional: making it subtler or removing if user wants simple */}
                <div
                  className={`pointer-events-none absolute bottom-0 h-1/3 w-full rounded-b-xl bg-gradient-to-t from-black/5 to-transparent`}
                />
              </div>

              {/* Label */}
              <div className="w-full px-2 text-center">
                <p
                  className={`truncate text-sm font-bold transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-black'}`}
                >
                  {p.title}
                </p>
                <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-wider text-gray-400">
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
