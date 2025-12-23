'use client';

import { useState } from 'react';
import { LayoutDashboard, History, Swords, Globe } from 'lucide-react';
import LighthouseAuditView from './LighthouseAuditView';
import LighthouseHistoryView from './LighthouseHistoryView';
import LighthouseBenchmarkView from './LighthouseBenchmarkView';
import LighthouseSiteAuditView from './LighthouseSiteAuditView';

type Tab = 'audit' | 'history' | 'benchmark' | 'site';

export default function LighthousePanel() {
    const [activeTab, setActiveTab] = useState<Tab>('audit');

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl p-1.5 border border-gray-200 inline-flex shadow-sm overflow-x-auto max-w-full">
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'audit'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <LayoutDashboard size={16} />
                    Single Audit
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'history'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <History size={16} />
                    History
                </button>
                <button
                    onClick={() => setActiveTab('benchmark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'benchmark'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Swords size={16} />
                    VS Mode
                </button>
                <button
                    onClick={() => setActiveTab('site')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'site'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Globe size={16} />
                    Full Site Scan
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'audit' && <LighthouseAuditView />}
                {activeTab === 'history' && <LighthouseHistoryView />}
                {activeTab === 'benchmark' && <LighthouseBenchmarkView />}
                {activeTab === 'site' && <LighthouseSiteAuditView />}
            </div>
        </div>
    );
}
