'use client';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <>
      {children}
    </>
  );
}