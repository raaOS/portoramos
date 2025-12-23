'use client';

import AdminLayout from '../components/AdminLayout';
import { Activity } from 'lucide-react';
import LighthousePanel from './components/LighthousePanel';

export default function AnalyticsPage() {
    return (
        <AdminLayout
            title="Analytics & Performance"
            subtitle="Monitor your website's performance, SEO, and accessibility metrics."
            titleIcon={<Activity className="h-6 w-6 text-orange-600" />}
            titleAccent="bg-orange-50 text-orange-600"
            breadcrumbs={[
                { label: 'Admin', href: '/admin' },
                { label: 'Analytics' },
            ]}
        >
            <div className="space-y-6">
                <LighthousePanel />
            </div>
        </AdminLayout>
    );
}
