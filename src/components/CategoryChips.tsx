"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState, Suspense } from 'react';
import { useNavigation } from '@/hooks/useNavigation';

function CategoryChipsInner() {
  const [tags, setTags] = useState<string[]>(['everything'])
  const { navigate } = useNavigation();
  const pathname = usePathname();
  const search = useSearchParams();
  const current = (search.get('tag') || 'everything').toLowerCase();

  useEffect(() => {
    let mounted = true
    fetch('/api/tags').then(r => r.json()).then((j) => {
      if (mounted && Array.isArray(j.tags)) setTags(j.tags)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const go = (tag: string) => {
    const sp = new URLSearchParams(search.toString());
    if (!tag || tag === 'everything') sp.delete('tag');
    else sp.set('tag', tag);
    const qs = sp.toString();
    navigate(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  const Chip = ({ t }: { t: string }) => {
    const active = t.toLowerCase() === current;
    return (
      <button
        key={t}
        onClick={() => go(t)}
        className={clsx(
          'px-4 py-2 rounded-full text-sm transition border whitespace-nowrap',
          active
            ? 'bg-orange-500 text-white border-orange-500'
            : 'bg-black/[.04] hover:bg-black/[.08] border-transparent text-gray-900'
        )}
      >
        {t}
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden md:flex items-center justify-center gap-3">
        {tags.map((t) => <Chip key={t} t={t} />)}
      </div>
      <div className="md:hidden overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 pr-2">
          {tags.map((t) => <Chip key={t} t={t} />)}
        </div>
      </div>
    </div>
  );
}

export default function CategoryChips() {
  return <CategoryChipsInner />
}
