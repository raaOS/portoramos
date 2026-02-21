// Telegram Admin Page
import type { Metadata } from 'next';
import { Suspense } from 'react';
import TelegramClient from './Client';

export const metadata: Metadata = {
    title: 'Telegram Bot Manager | Admin',
};

export default function TelegramPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading telegram logs...</div>}>
            <TelegramClient />
        </Suspense>
    );
}
