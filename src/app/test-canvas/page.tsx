'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';

const InfiniteCanvas3D = dynamic(
  () => import('@/components/projects/InfiniteCanvas3D'),
  { ssr: false }
);

function PageContent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <main className="h-screen w-full overflow-hidden bg-zinc-50">
      {/* Header overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-black text-2xl font-bold tracking-tight">Infinite Canvas</h1>
          {mounted && (
            <p className="text-black/60 text-sm mt-1">
              Drag to pan • Scroll to fly • Click to view
            </p>
          )}
        </div>
        <a 
          href="/projects" 
          className="pointer-events-auto px-4 py-2 bg-black/10 hover:bg-black/20 text-black rounded-full text-sm backdrop-blur-sm transition-colors"
        >
          ← Back to Projects
        </a>
      </div>

      {mounted && (
        <Suspense fallback={null}>
          <InfiniteCanvas3D />
        </Suspense>
      )}
    </main>
  );
}

export default function TestCanvasPage() {
  return <PageContent />;
}
