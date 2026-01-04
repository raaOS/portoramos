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
    },
    {
        id: 'ae',
        name: 'Adobe After Effects',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-plain.svg',
        level: 'Advanced',
        color: '#9999FF',
        details: [
            'Motion Graphics & Visual Effects',
            '2D/3D Animation Compositing',
            'Rotoscoping & Keying',
            'Expression Scripting for Automation'
        ]
    },
    {
        id: 'pr',
        name: 'Adobe Premiere Pro',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-plain.svg',
        level: 'Advanced',
        color: '#9999FF',
        details: [
            'Professional Video Editing & Sequencing',
            'Color Correction & Grading (Lumetri)',
            'Audio Mixing & Sound Design',
            'Multi-camera Editing Workflow'
        ]
    },
    {
        id: 'blender',
        name: 'Blender',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg',
        level: 'Intermediate',
        color: '#E87D0D',
        details: [
            '3D Modeling & Sculpting',
            'Texturing & UV Unwrapping',
            'Cycles/Eevee Rendering & Lighting',
            'Basic Animation & Rigging'
        ]
    },
    {
        id: 'id',
        name: 'Adobe InDesign',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/indesign/indesign-plain.svg',
        level: 'Intermediate',
        color: '#FF3366',
        details: [
            'Editorial Design & Layout',
            'Digital Publishing (EPUB, Interactive PDF)',
            'Master Pages & Style Sheets',
            'Typography & Typesetting'
        ]
    },
    {
        id: 'xd',
        name: 'Adobe XD',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xd/xd-plain.svg',
        level: 'Intermediate',
        color: '#FF26BE',
        details: [
            'Wireframing & UI Prototyping',
            'User Flow Interaction Design',
            'Auto-animate Transitions',
            'Design Specs Handoff'
        ]
    },
    {
        id: 'c4d',
        name: 'Cinema 4D',
        icon: 'https://simpleicons.org/icons/cinema4d.svg', // Fallback or explicit URL if devicon missing
        level: 'Basic',
        color: '#004BB3',
        details: [
            '3D Motion Graphics (MoGraph)',
            'Modeling & Deformers',
            'Lighting & Materials',
            'Redshift Integration Basics'
        ]
    }
];

export default function HardSkillsAccordion() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const toggle = (id: string) => {
        setActiveId(activeId === id ? null : id);
    };

    const visibleSkills = showAll ? skills : skills.slice(0, 4);

    return (
        <div className="w-full space-y-4">
            <div className="w-full space-y-3">
                <AnimatePresence initial={false} mode='popLayout'>
                    {visibleSkills.map((skill) => {
                        const isOpen = activeId === skill.id;

                        return (
                            <motion.div
                                layout
                                key={skill.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={`
                                    w-full overflow-hidden rounded-2xl border transition-colors duration-300
                                    ${isOpen ? 'bg-white border-black' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}
                                `}
                            >
                                {/* Header / Trigger */}
                                <button
                                    onClick={() => toggle(skill.id)}
                                    className="w-full flex items-center justify-between p-4 text-left outline-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center p-2 transition-colors duration-300
                                            ${isOpen ? 'bg-gray-100' : 'bg-white border border-gray-100'}
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
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="content"
                                            initial="collapsed"
                                            animate="open"
                                            exit="collapsed-exit"
                                            variants={{
                                                open: { opacity: 1, height: 'auto' },
                                                collapsed: { opacity: 0, height: 0 },
                                                "collapsed-exit": { opacity: 1, height: 0 }
                                            }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                            style={{ willChange: "height" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-5 pt-0 pl-[5.5rem]">
                                                <div className="h-px w-full bg-gray-100 mb-4" />
                                                <ul className="space-y-2">
                                                    {skill.details.map((detail, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-start text-sm text-gray-600 animate-fadeIn"
                                                            style={{ animationDelay: `${idx * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 mr-2.5 flex-shrink-0" />
                                                            {detail}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Show More Button */}
            {skills.length > 4 && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="group flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-black text-black hover:text-white rounded-full transition-all duration-300 font-medium text-sm"
                    >
                        <span>{showAll ? 'Show Less' : `View All ${skills.length} Software`}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : 'group-hover:translate-y-1'}`} />
                    </button>
                </div>
            )}
        </div>
    );
}
