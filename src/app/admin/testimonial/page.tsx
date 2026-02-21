import { Suspense } from 'react';
import AdminTestimonialClient from './AdminTestimonialClient';



export default function AdminTestimonialPage() {
  return (
    <Suspense fallback={<div>Loading component module...</div>}>
      <AdminTestimonialClient />
    </Suspense>
  );
}






