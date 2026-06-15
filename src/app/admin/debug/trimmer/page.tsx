'use client';
import { useState } from 'react';
import VideoTrimmer from '@/components/admin/VideoTrimmer';
import { useToast } from '@/contexts/ToastContext';

export default function DebugTrimmerPage() {
  const [file, setFile] = useState<File | null>(null);
  const { showSuccess } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-white p-10 text-black">
      <h1 className="mb-4 text-2xl font-bold">Debug Video Trimmer</h1>

      {!file && (
        <div className="rounded border-2 border-dashed border-gray-300 p-10 text-center">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
          />
          <p className="mt-2 text-gray-500">Upload a local video to test</p>
        </div>
      )}

      {file && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-sm">
            Loaded: {file.name} ({file.size} bytes)
          </p>
          <button
            onClick={() => setFile(null)}
            className="mb-4 rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
          >
            Reset / Choose Another
          </button>

          <div className="relative h-[600px] overflow-hidden rounded-lg border border-gray-200">
            <VideoTrimmer
              file={file}
              onConfirm={(s, e, _c) => {
                showSuccess(`Confirmed: ${s} - ${e}`);
              }}
              onCancel={() => setFile(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
