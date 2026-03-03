"use client";

import dynamic from 'next/dynamic';
import type { DesktopEnvironmentProps } from './DesktopEnvironment';

// Static loading component - solid black to match boot sequence
function DesktopLoading() {
  return (
    <div className="fixed inset-0 bg-black" />
  );
}

// Dynamic import with loading state
const DynamicDesktop = dynamic(() => import('./DesktopEnvironment'), {
  ssr: false,
  loading: DesktopLoading,
});

// Wrapper component
export default function DesktopEnvironmentClient(props: DesktopEnvironmentProps) {
  return <DynamicDesktop {...props} />;
}
