import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminFeedbackClient from '@/app/admin/communications/feedback/AdminFeedbackClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Feedback Moderation',
  description: 'Moderate client rating feedbacks',
  path: '/admin/communications/feedback',
});

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={null}>
      <div className="flex-1 space-y-6 p-6">
        <AdminFeedbackClient />
      </div>
    </Suspense>
  );
}
