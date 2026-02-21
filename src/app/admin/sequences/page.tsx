import type { Metadata } from 'next';
import { Suspense } from 'react';
import SequenceList from "./_components/SequenceList";
import SequenceGenerator from "./_components/SequenceGenerator";

export const metadata: Metadata = {
    title: 'Image Sequence Generator | Admin',
};

export default function SequencesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading sequence editor...</div>}>
            <div className="space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Image Sequence Generator</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Upload zip file berisi sequence frame dan generate file konfigurasi JSON.
                    </p>
                </div>

                <div className="grid gap-8">
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <SequenceGenerator />
                    </div>
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <SequenceList />
                    </div>
                </div>
            </div>
        </Suspense>
    );
}
