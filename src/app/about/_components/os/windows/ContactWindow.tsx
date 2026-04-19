'use client';

import useSWR from 'swr';
import FullPageChat from '@/components/chat/FullPageChat';
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

function toContactInfo(data?: ContactData): FullPageChatContactInfo | undefined {
  if (!data) return undefined;
  return {
    email: data.info?.email,
    socialMedia: data.info?.socialMedia,
    headline: data.content?.headline,
    subtext: data.content?.subtext
  };
}

export default function ContactWindow({ initialData }: ContactWindowProps) {
  const { data } = useSWR('/api/contact', fetcher, {
    fallbackData: initialData ?? undefined,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
    revalidateOnMount: !initialData
  });

  return <FullPageChat embedded contactInfo={toContactInfo(data)} />;
}
