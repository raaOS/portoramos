import React from 'react';

export default function ProjectCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
            {/* Image Skeleton */}
            <div className="relative aspect-video bg-gray-200 w-full" />

            {/* Content Skeleton */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4 space-y-3">
                    {/* Title & Toggle */}
                    <div className="flex justify-between items-start gap-2">
                        <div className="h-6 bg-gray-200 rounded w-3/4" />
                        <div className="h-5 w-8 bg-gray-200 rounded-full" />
                    </div>

                    {/* Metadata */}
                    <div className="h-4 bg-gray-200 rounded w-1/3" />

                    {/* Description (2 lines) */}
                    <div className="space-y-2 pt-1">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <div className="h-8 w-12 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
