'use client';

import dynamic from 'next/dynamic';
import type { Comment } from '@/lib/magic';

// Lazy load heavy CommentSection component
const CommentSection = dynamic(() => import('@/components/features/CommentSection'), {
    loading: () => <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />,
    ssr: false
});

interface ProjectCommentsProps {
    slug: string;
    comments: Comment[];
    setComments: (comments: Comment[]) => void;
    allowComments?: boolean;
}

export function ProjectComments({ slug, comments, setComments, allowComments = true }: ProjectCommentsProps) {
    if (!allowComments) return null;

    return (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <CommentSection
                slug={slug}
                comments={comments}
                setComments={setComments}
            />
        </div>
    );
}
