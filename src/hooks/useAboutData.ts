import { useQuery } from '@tanstack/react-query';
import { AboutData } from '@/types/about';

async function fetchAboutData(): Promise<AboutData> {
  const response = await fetch('/api/about');
  if (!response.ok) {
    throw new Error('Failed to fetch about data');
  }
  return response.json();
}

export function useAboutData() {
  return useQuery({
    queryKey: ['about'],
    queryFn: fetchAboutData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}