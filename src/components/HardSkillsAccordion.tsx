'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

// Hardcoded data for now, as requested
const skills = [
    {
        id: 'ps',
        name: 'Adobe Photoshop',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg',
        level: 'Expert',
        color: '#31A8FF',
        details: [
            'Advanced Photo Manipulation & Compositing',
            'High-end Beauty Retouching & Color Grading',
            'Complex Masking & Deep Etching',
            'Digital Imaging for Advertising'
        ]
    },
    {
        id: 'ai',
        name: 'Adobe Illustrator',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg',
        level: 'Expert',
        color: '#FF9A00',
        details: [
            'Vector Illustration & Iconography',
            'Logo Design & Brand Identity Systems',
            'Typography Layout & manipulation',
            'Print-ready asset preparation (Pre-press)'
        ]
    },
    {
        id: 'figma',
        name: 'Figma',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
        level: 'Advanced',
        color: '#F24E1E',
        details: [
            'UI/UX Interface Design for Web & Mobile',
            'Interactive Prototyping & Micro-interactions',
            'Design System Management (Components, Variables)',
            'Auto-layout Expert & Responsive Constraints'
        ]
    },
    {
        id: 'canva',
        name: 'Canva',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg',
        level: 'Intermediate',
        color: '#00C4CC',
        details: [
            'Rapid Social Media Content Creation',
            'Professional Pitch Decks & Presentations',
            'Team Collaboration & Template Management',
            'Quick Visual Assets for Marketing'
        ]
    }
];

export default function HardSkillsAccordion() {
    const [activeId, setActiveId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setActiveId(activeId === id ? null : id);
    };

    return (
        <div className="w-full space-y-3">
            {skills.map((skill) => {
                const isOpen = activeId === skill.id;

                return (
                    <motion.div
                        layout
                        key={skill.id}
                        className={`
                            overflow-hidden rounded-2xl border transition-colors duration-300
                            ${isOpen ? 'bg-white border-black shadow-lg' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}
                        `}
                        initial={false}
                    >
                        {/* Header / Trigger */}
                        <motion.button
                            layout="position"
                            onClick={() => toggle(skill.id)}
                            className="w-full flex items-center justify-between p-4 text-left outline-none"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center p-2 transition-colors duration-300
                                    ${isOpen ? 'bg-gray-100' : 'bg-white shadow-sm border border-gray-100'}
                                `}>
                                    <Image
                                        src={skill.icon}
                                        alt={skill.name}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-contain"
                                        unoptimized
                                    />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-base md:text-lg ${isOpen ? 'text-black' : 'text-gray-700'}`}>
                                        {skill.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium tracking-wide">
                                        {skill.level}
                                    </p>
                                </div>
                            </div>

                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center
                                    ${isOpen ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}
                                `}
                            >
                                <ChevronDown className="w-4 h-4" />
                            </motion.div>
                        </motion.button>

                        {/* Expanded Content */}
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    key="content"
                                    initial="collapsed"
                                    animate="open"
                                    exit="collapsed"
                                    variants={{
                                        open: { opacity: 1, height: 'auto' },
                                        collapsed: { opacity: 0, height: 0 }
                                    }}
                                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }} // Smooth easeOutCirc-ish
                                >
                                    <div className="px-4 pb-5 pt-0 pl-[5.5rem]">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="h-px w-full bg-gray-100 mb-4"
                                        />
                                        <ul className="space-y-2">
                                            {skill.details.map((detail, idx) => (
                                                <motion.li
                                                    key={idx}
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.1 + (idx * 0.05) }}
                                                    className="flex items-start text-sm text-gray-600"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 mr-2.5 flex-shrink-0" />
                                                    {detail}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
