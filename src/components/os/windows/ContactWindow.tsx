'use client';

import { useState, useEffect } from 'react';
import FullPageChat from '@/components/chat/FullPageChat';
import { type Locale, useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/lib/i18n/contentLocalization';
import type { ContactData } from '@/types/contact';

interface FullPageChatContactInfo {
  email?: string;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    behance?: string;
    whatsapp?: string;
  };
  headline?: string;
  subtext?: string;
}

interface ContactWindowProps {
  initialData?: ContactData | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to load contact data');
  }
  return res.json() as Promise<ContactData>;
};

function toContactInfo(
  data: ContactData | undefined,
  locale: Locale
): FullPageChatContactInfo | undefined {
  if (!data) return undefined;
  return {
    email: data.info?.email,
    socialMedia: data.info?.socialMedia,
    headline: localizeText(data.content?.headline, locale),
    subtext: localizeText(data.content?.subtext, locale),
  };
}

export default function ContactWindow({ initialData }: ContactWindowProps) {
  const { locale } = useLanguage();
  const [data, setData] = useState<ContactData | undefined>(initialData ?? undefined);

  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    fetcher('/api/contact')
      .then((contactData) => {
        if (!cancelled) {
          setData(contactData);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialData]);

  return <FullPageChat embedded contactInfo={toContactInfo(data, locale)} />;
}
