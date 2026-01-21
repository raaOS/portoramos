'use client';

import { motion } from 'framer-motion';
import { Reveal } from '@/components/effects/Reveal';
// import { ArrowRight } from 'lucide-react'; // Removing unused import
import { DesignPhilosophy } from '@/types/about';
import InteractiveCard from './InteractiveCard';

interface DesignPhilosophySectionProps {
    data?: DesignPhilosophy;
}

export default function DesignPhilosophySection({ data }: DesignPhilosophySectionProps) {
    // Fallback data if API fails or data missing
    const defaultSteps = [
        {
            number: "01",
            title: "Context & Purpose",
            desc: "Sebelum menyentuh kanvas digital, saya membedah masalah bisnisnya. Apa produknya? Siapa targetnya?",
            quote: "Pesan utama apa yang ingin disampaikan?"
        },
        {
            number: "02",
            title: "Strategic Scope",
            desc: "Saya tidak sekadar mendekorasi. Saya fokus pada hierarki visual yang tepat untuk memastikan pesan tersampaikan.",
            quote: "Fokus pada esensi, bukan dekorasi."
        },
        {
            number: "03",
            title: "Execution & Result",
            desc: "Estetika adalah penguat pesan. Saya menciptakan visual yang tajam, konsisten, dan mudah diingat audiens.",
            quote: "Apakah audiens paham? Apakah mereka ingat?"
        }
    ];

    const heading = data?.heading || "Design Philosophy";
    const subheading = data?.subheading || "Strategic Thinking Framework";
    const steps = data?.steps || defaultSteps;

    return (
        <section className="py-24 md:py-32 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="mb-20 text-left max-w-3xl">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-8 shadow-sm text-white">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            {heading}
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <h2 className="text-3xl md:text-5xl font-bold font-sans leading-tight mb-6 text-white">
                            {subheading}
                        </h2>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <p className="text-gray-400 font-sans text-lg italic">
                            "Desain untuk <span className="text-blue-500 font-semibold">Dampak</span>, Bukan Sekadar Estetika."
                        </p>
                    </Reveal>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 relative"> {/* Increased gap for better spacing */}

                    {/* Background Connection Line (Desktop Only) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent -z-10 transform -translate-y-1/2" />

                    {steps.map((step, index) => (
                        <InteractiveCard
                            key={index}
                            number={step.number}
                            title={step.title}
                            desc={step.desc}
                            quote={step.quote}
                        />
                    ))}

                </div>

            </div>
        </section>
    );
}
