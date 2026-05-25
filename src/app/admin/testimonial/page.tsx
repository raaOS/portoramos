import { Suspense } from 'react';
import AdminTestimonialClient from './AdminTestimonialClient';

export default function AdminTestimonialPage() {
  return (
    <Suspense fallback={null}>
      <AdminTestimonialClient />
    </Suspense>
  );
}
