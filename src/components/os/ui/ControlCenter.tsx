import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wifi, Bluetooth, Airplay, Moon, Sun, Volume2 } from 'lucide-react';

interface ControlCenterProps {
    isOpen: boolean;
    onClose?: () => void;
}

export default function ControlCenter({ isOpen, onClose: _onClose }: ControlCenterProps) {
    const [wifiState, setWifiState] = useState(true);
    const [bluetoothState, setBluetoothState] = useState(true);
    const [airdropState, setAirdropState] = useState(false);
    const [dndState, setDndState] = useState(false);
    const [brightness, setBrightness] = useState(80);
    const [volume, setVolume] = useState(50);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            transition={{ type: "spring", stiffness: 450, damping: 26, mass: 1 }}
            style={{ transformOrigin: "center center" }}
            className="fixed top-12 right-2 sm:right-4 w-[320px] rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-3xl border border-white/20 dark:border-white/10 p-4 z-[10001] text-black dark:text-white"
        >
            {/* Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Connections Block */}
                <div className="bg-white/50 dark:bg-white/10 rounded-xl p-3 flex flex-col gap-3 border border-black/5 dark:border-white/5">
                    {/* Wifi */}
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setWifiState(!wifiState)}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${wifiState ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-300'}`}>
                            <Wifi size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold">Wi-Fi</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{wifiState ? 'Home' : 'Off'}</span>
                        </div>
                    </div>
                    {/* Bluetooth */}
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setBluetoothState(!bluetoothState)}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${bluetoothState ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-300'}`}>
                            <Bluetooth size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold">Bluetooth</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{bluetoothState ? 'On' : 'Off'}</span>
                        </div>
                    </div>
                    {/* AirDrop */}
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setAirdropState(!airdropState)}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${airdropState ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-300'}`}>
                            <Airplay size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold">AirDrop</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{airdropState ? 'Contacts Only' : 'Everyone'}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side Buttons */}
                <div className="flex flex-col gap-3">
                    {/* Focus/DND */}
                    <div 
                        className={`flex-1 rounded-xl p-3 flex flex-col justify-center items-center gap-2 cursor-pointer transition-colors border border-black/5 dark:border-white/5 ${dndState ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-white/50 dark:bg-white/10'}`}
                        onClick={() => setDndState(!dndState)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dndState ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-200'}`}>
                            <Moon size={16} fill={dndState ? "currentColor" : "none"} />
                        </div>
                        <span className="text-xs font-semibold">{dndState ? 'Do Not Disturb' : 'Focus'}</span>
                    </div>
                </div>
            </div>

            {/* Sliders Area */}
            <div className="space-y-3">
                {/* Brightness Display */}
                <div className="bg-white/50 dark:bg-white/10 rounded-xl p-3 border border-black/5 dark:border-white/5 flex items-center gap-3">
                    <Sun size={16} className="text-gray-500 dark:text-gray-400" />
                    <div className="h-6 flex-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden border border-black/5 dark:border-white/10 relative">
                        <div className="absolute top-0 left-0 bottom-0 bg-zinc-900 dark:bg-white transition-all duration-200" style={{ width: `${brightness}%` }}></div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={brightness} 
                            onChange={(e) => {
                                setBrightness(parseInt(e.target.value));
                                // In a real app, this would change global document filter
                                document.documentElement.style.filter = `brightness(${(parseInt(e.target.value) / 100) * 0.5 + 0.5})`;
                            }}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
                
                {/* Volume Display */}
                <div className="bg-white/50 dark:bg-white/10 rounded-xl p-3 border border-black/5 dark:border-white/5 flex items-center gap-3">
                    <Volume2 size={16} className="text-gray-500 dark:text-gray-400" />
                    <div className="h-6 flex-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden border border-black/5 dark:border-white/10 relative">
                        <div className="absolute top-0 left-0 bottom-0 bg-zinc-900 dark:bg-white transition-all duration-200" style={{ width: `${volume}%` }}></div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={volume} 
                            onChange={(e) => setVolume(parseInt(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
