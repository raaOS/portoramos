'use client';

import { motion } from 'framer-motion';
import { Reveal } from '@/components/effects/Reveal';
import { ArrowRight } from 'lucide-react';

export default function DesignPhilosophySection() {
    const steps = [
        {
            number: "01",
            title: "Konteks & Tujuan",
            desc: "Sebelum menyentuh kanvas digital, saya membedah masalah bisnisnya. Apa produknya? Siapa targetnya?",
            quote: "Pesan utama apa yang ingin disampaikan?"
        },
        {
            number: "02",
            title: "Lingkup Strategis",
            desc: "Saya tidak sekadar mendekorasi. Saya fokus pada hierarki visual yang tepat untuk memastikan pesan tersampaikan.",
            quote: "Fokus pada esensi, bukan dekorasi."
        },
        {
            number: "03",
            title: "Eksekusi & Hasil",
            desc: "Estetika adalah penguat pesan. Saya menciptakan visual yang tajam, konsisten, dan mudah diingat audiens.",
            quote: <>Apakah audiens paham?<br />Apakah mereka ingat?</>
        }
    ];

    return (
        <section className="py-24 md:py-32 bg-gray-50 border-b border-gray-200 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="mb-20 text-left max-w-3xl">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-8 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Pola Pikir Desain
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <h2 className="text-3xl md:text-5xl font-bold font-sans leading-tight mb-6 text-gray-900">
                            Berikut kerangka berpikir saya<br />
                            sebelum memulai desain
                        </h2>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <p className="text-gray-500 font-sans text-lg italic">
                            "Desain untuk <span className="text-blue-600 font-semibold">Dampak</span>, Bukan Sekadar Estetika."
                        </p>
                    </Reveal>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 relative"> {/* Increased gap for better spacing */}

                    {/* Background Connection Line (Desktop Only) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent -z-10 transform -translate-y-1/2" />

                    {steps.map((step, index) => (
                        <Reveal key={index} delay={0.2 + (index * 0.1)} className="h-full" overflowVisible={true} fullHeight={true}>
                            <motion.div
                                className="group relative bg-white h-full p-8 md:p-10 rounded-2xl border border-black transition-all duration-500 ease-out"
                                whileHover={{ y: -5 }}
                            >
                                {/* Giant Background Number */}
                                <div className="absolute -top-4 -right-4 text-9xl font-bold text-gray-50 opacity-50 group-hover:text-blue-50/50 group-hover:scale-110 transition-all duration-500 select-none pointer-events-none font-display">
                                    {step.number}
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Number Badge */}
                                    <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-6 shadow-lg group-hover:bg-blue-600 transition-colors duration-300">
                                        {step.number}
                                    </div>

                                    <h3 className="text-2xl font-bold font-sans text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                                        {step.title}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed mb-6 font-sans text-sm md:text-base flex-grow">
                                        {step.desc}
                                    </p>

                                    {/* Quote Box */}
                                    <div className="mt-auto pt-6 border-t border-gray-100">
                                        <p className="text-sm font-bold text-gray-900 italic">
                                            {step.quote}
                                        </p>
                                    </div>
                                </div>

                                {/* Mobile Arrow (Bottom Center) - Only for 1 and 2 */}
                                {index < 2 && (
                                    <div className="md:hidden absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-400 z-30 shadow-sm">
                                        <ArrowRight size={14} className="rotate-90" />
                                    </div>
                                )}

                                {/* Desktop Arrow (Right Center) - Only for 1 and 2 */}
                                {index < 2 && (
                                    <div className="hidden md:flex absolute -right-[3.25rem] top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full border border-gray-200 items-center justify-center text-gray-400 z-30 shadow-sm text-blue-600">
                                        <ArrowRight size={16} />
                                    </div>
                                )}
                            </motion.div>
                        </Reveal>
                    ))}

                </div>

            </div>
        </section>
    );
}
