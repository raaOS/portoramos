import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
    onComplete: () => void;
}

const BootSequence = ({ onComplete }: BootSequenceProps) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Timeline:
        // 0s: Black Screen
        // 0.5s: Logo Appears
        // 1.5s: System Ready
        // 2.0s: Reveal

        const timer1 = setTimeout(() => setStep(1), 500);
        const timer2 = setTimeout(() => setStep(2), 1500);
        const timer3 = setTimeout(() => {
            setStep(3);
            setTimeout(onComplete, 800); // 0.8s for exit animation
        }, 2000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {step < 3 && (
                <m.div
                    className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none cursor-wait"
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.1,
                        filter: "blur(10px)",
                        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                    }}
                >
                    {/* Logo Container */}
                    <div className="relative">
                        {step >= 1 && (
                            <m.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="flex flex-col items-center gap-6"
                            >
                                {/* Logo (SVG or Text) */}
                                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                                    <span className="text-3xl font-bold tracking-tighter text-black">R</span>
                                </div>

                                {/* Text */}
                                <div className="text-center space-y-2">
                                    <h1 className="text-white font-medium tracking-[0.2em] text-sm">RAMOS OS</h1>
                                    <div className="h-0.5 w-8 bg-white/20 mx-auto rounded-full overflow-hidden">
                                        <m.div
                                            className="h-full bg-white"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                        />
                                    </div>
                                </div>
                            </m.div>
                        )}
                    </div>

                    {/* Console Log Bottom Left */}
                    <div className="absolute bottom-12 left-12 font-mono text-[10px] text-gray-500 space-y-1">
                        {step >= 1 && (
                            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                {'>'} BIOS_CHECK... OK
                            </m.div>
                        )}
                        {step >= 1 && (
                            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                                {'>'} MEMORY_INIT... 64GB OK
                            </m.div>
                        )}
                        {step >= 2 && (
                            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {'>'} LOADING_KERNEL... DONE
                            </m.div>
                        )}
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
};

export default BootSequence;
