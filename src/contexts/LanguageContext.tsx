'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (en: string, id: string) => string; // Helper for simple text switching
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved language or default to 'en'
        const savedLang = localStorage.getItem('pixel_portfolio_lang') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'id')) {
            setLanguage(savedLang);
        }
        setMounted(true);
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('pixel_portfolio_lang', lang);
    };

    const toggleLanguage = () => {
        handleSetLanguage(language === 'en' ? 'id' : 'en');
    };

    // Helper to get text based on current language
    // Usage: t('Hello', 'Halo')
    const t = (en: string, id: string) => {
        return language === 'en' ? en : (id || en); // Fallback to EN if ID is empty
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
