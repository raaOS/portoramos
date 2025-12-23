'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function LanguageToggle() {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 min-w-[5rem] overflow-hidden group border border-gray-200"
            aria-label="Toggle language"
        >
            <div className="relative z-10 flex items-center justify-between w-full text-xs font-bold leading-none">
                <span className={`transition-colors duration-300 ${language === 'en' ? 'text-white' : 'text-gray-400'}`}>
                    EN
                </span>
                <span className={`transition-colors duration-300 ${language === 'id' ? 'text-white' : 'text-gray-400'}`}>
                    ID
                </span>
            </div>

            {/* Background Pill */}
            <motion.div
                className="absolute top-0 bottom-0 w-1/2 bg-black rounded-full"
                initial={false}
                animate={{
                    x: language === 'en' ? '-50%' : '50%',
                    left: '50%'
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
        </button>
    );
}
