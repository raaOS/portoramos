'use client';

import dynamic from 'next/dynamic';
import type { Comment } from '@/lib/magic';

// Lazy load heavy CommentSection component
const CommentSection = dynamic(() => import('@/components/features/CommentSection'), {
  loading: () => <div className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />,
  ssr: false,
});

interface ProjectCommentsProps {
  slug: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  allowComments?: boolean;
}

export function ProjectComments({
  slug,
  comments,
  setComments,
  allowComments = true,
}: ProjectCommentsProps) {
  if (!allowComments) return null;

  return (
    <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
      <CommentSection slug={slug} comments={comments} setComments={setComments} />
    </div>
  );
}
