import AdminLayout from '../components/AdminLayout';
import { Bot } from 'lucide-react';
import AIHunterClient from '@/app/admin/ai-hunter/AIHunterClient';

export default function AIHunterPage() {
    return (
        <AdminLayout
            title="AI Hunter"
            subtitle="Automated job search and outreach agent"
            titleIcon={<Bot className="h-6 w-6 text-indigo-600" />}
            titleAccent="bg-indigo-50 text-indigo-700"
        >
            <AIHunterClient />
        </AdminLayout>
    );
}
