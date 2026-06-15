'use client';

import { Loader2, CheckCircle2 } from 'lucide-react';

interface UploadProgressProps {
  status: string;
  progress: number;
}

export function UploadProgress({ status, progress }: UploadProgressProps) {
  const isComplete = status === 'Upload Complete!';

  return (
    <div className="mx-auto w-full max-w-md space-y-4" aria-live="polite">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="relative">
          {isComplete ? (
            <div className="animate-in zoom-in relative rounded-xl border border-green-100 bg-white p-3 duration-300">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500 opacity-20 blur-xl"></div>
              <div className="relative rounded-xl border border-violet-100 bg-white p-3">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            </>
          )}
        </div>

        <div className="space-y-1 text-center">
          <p className={`text-sm font-semibold ${isComplete ? 'text-green-600' : 'text-gray-900'}`}>
            {status}
          </p>
          <p className="font-mono text-xs text-gray-500">{progress}% Complete</p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
