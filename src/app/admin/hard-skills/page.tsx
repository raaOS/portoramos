import type { Metadata } from 'next';
import AdminLayout from '../components/AdminLayout';
import HardSkillsManager from '../HardSkillsManager';
import { Cpu } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Admin - Hard Skills',
    description: 'Manage hard skills list',
};

export default function HardSkillsPage() {
    return (
        <AdminLayout
            title="Hard Skills"
            subtitle="Manage your technical expertise list"
            breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Hard Skills' }]}
            titleIcon={<Cpu className="h-5 w-5" aria-hidden />}
            titleAccent="bg-cyan-50 text-cyan-600"
        >
            <HardSkillsManager />
        </AdminLayout>
    );
}
