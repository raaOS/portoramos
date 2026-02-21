import { Suspense } from 'react';
import AdminAnalyticsClient from './AdminAnalyticsClient';



export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div>Loading analytics data...</div>}>
            <AdminAnalyticsClient />
        </Suspense>
    );
}





