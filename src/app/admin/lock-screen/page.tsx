
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import LockScreenClient from './Client';

export const metadata: Metadata = generateSEOMetadata({
    title: 'Admin - Lock Screen Management',
    description: 'Manage lock screen content',
    path: '/admin/lock-screen'
});

export default function AdminLockScreenPage() {
    return <LockScreenClient />;
}
