'use client';
import { useState } from 'react';
import VideoTrimmer from '@/components/admin/VideoTrimmer';



export default function DebugTrimmerPage() {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="p-10 text-black bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Debug Video Trimmer</h1>

            {!file && (
                <div className="border-2 border-dashed border-gray-300 p-10 text-center rounded">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-violet-50 file:text-violet-700
                          hover:file:bg-violet-100"
                    />
                    <p className="mt-2 text-gray-500">Upload a local video to test</p>
                </div>
            )}

            {file && (
                <div className="mt-4">
                    <p className="mb-2 font-mono text-sm">Loaded: {file.name} ({file.size} bytes)</p>
                    <button
                        onClick={() => setFile(null)}
                        className="mb-4 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                    >
                        Reset / Choose Another
                    </button>

                    <div className="border border-gray-200 rounded-lg overflow-hidden h-[600px] relative">
                        <VideoTrimmer
                            file={file}
                            onConfirm={(s, e, c) => {
                                alert(`Confirmed: ${s} - ${e}`);
                            }}
                            onCancel={() => setFile(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}




