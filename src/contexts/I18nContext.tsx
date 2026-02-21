'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { id, Dictionary } from '@/dictionaries/id';
import { en } from '@/dictionaries/en';

type Language = 'id' | 'en';

interface I18nContextType {
    locale: Language;
    setLocale: (locale: Language) => void;
    t: Dictionary;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Language>('id');

    // Load preference from localStorage
    useEffect(() => {
        const savedLocale = localStorage.getItem('locale') as Language;
        if (savedLocale && (savedLocale === 'id' || savedLocale === 'en')) {
            requestAnimationFrame(() => setLocale(savedLocale));
        }
    }, []);

    const handleSetLocale = (newLocale: Language) => {
        setLocale(newLocale);
        localStorage.setItem('locale', newLocale);
    };

    const dictionary = locale === 'id' ? id : en;

    return (
        <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t: dictionary }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}
