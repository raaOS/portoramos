import React from 'react';
import { Image, Palette, Check } from 'lucide-react';

interface SettingsWindowProps {
    currentWallpaper: string;
    setWallpaper: (url: string) => void;
    currentAccent: string;
    setAccent: (color: string) => void;
}

const wallpapers = [
    { id: 1, url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop", name: "Abstract Fluid" },
    { id: 2, url: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop", name: "Dark Mountains" },
    { id: 3, url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop", name: "Deep Space" },
    { id: 4, url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", name: "Clean Beach" }
];

const accents = [
    { id: 'blue', color: 'bg-blue-500', hex: '#3B82F6', name: 'Ramos Blue' },
    { id: 'purple', color: 'bg-purple-500', hex: '#A855F7', name: 'Cyber Purple' },
    { id: 'green', color: 'bg-green-500', hex: '#22C55E', name: 'Eco Green' },
    { id: 'orange', color: 'bg-orange-500', hex: '#F97316', name: 'Sunset Orange' },
    { id: 'pink', color: 'bg-pink-500', hex: '#EC4899', name: 'Neon Pink' },
];

export default function SettingsWindow({ currentWallpaper, setWallpaper, currentAccent, setAccent }: SettingsWindowProps) {
    return (
        <div className="w-full h-full bg-[#f5f5f7] flex flex-col overflow-hidden text-[#1d1d1f]">
            {/* Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                <div className="w-48 bg-[#e8e8ed]/50 border-r border-[#d2d2d7] p-4 flex flex-col gap-1 pt-8">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#007AFF] text-white text-sm font-medium">
                        <Image size={16} />
                        <span>Wallpaper</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 text-gray-600 text-sm font-medium transition-colors cursor-pointer">
                        <Palette size={16} />
                        <span>Appearance</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <h2 className="text-2xl font-semibold mb-6">Wallpaper & Style</h2>

                    {/* Wallpaper Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Choose Wallpaper</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {wallpapers.map(wp => (
                                <div
                                    key={wp.id}
                                    className={`relative group cursor-pointer rounded-xl overflow-hidden aspect-video border-2 transition-all ${currentWallpaper === wp.url ? 'border-[#007AFF] shadow-md scale-[1.02]' : 'border-transparent hover:scale-[1.01]'}`}
                                    onClick={() => setWallpaper(wp.url)}
                                >
                                    <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    {currentWallpaper === wp.url && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center shadow-sm">
                                            <Check size={14} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-medium">{wp.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accent Color Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">System Accent Color</h3>
                        <div className="flex gap-4">
                            {accents.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => setAccent(acc.color)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 ${acc.color} ${currentAccent === acc.color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                    title={acc.name}
                                >
                                    {currentAccent === acc.color && <Check size={16} className="text-white" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">This will change the color of window controls and active elements.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
