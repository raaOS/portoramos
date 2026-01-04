'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface HardSkill {
    id: string;
    name: string;
    icon: string;
    level: string;
    color: string;
    details: string[];
}

export default function HardSkillsAccordion() {
    const [skills, setSkills] = useState<HardSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const res = await fetch('/api/hard-skills');
                if (res.ok) {
                    const data = await res.json();
                    setSkills(data);
                }
            } catch (error) {
                console.error('Failed to fetch hard skills:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSkills();
    }, []);

    const toggle = (id: string) => {
        setActiveId(activeId === id ? null : id);
    };

    const visibleSkills = showAll ? skills : skills.slice(0, 4);

    if (loading) {
        return (
            <div className="w-full space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-20 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

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
