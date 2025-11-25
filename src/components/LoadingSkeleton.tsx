/**
 * Loading Skeleton Component
 * Displays animated placeholder while content is loading
 */
export function LoadingSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse ${className}`}>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        </div>
    );
}

/**
 * Card Loading Skeleton
 * Mimics the Card component structure
 */
export function CardSkeleton() {
    return (
        <div className="block group">
            <div className="relative">
                <div className="overflow-hidden rounded-2xl relative">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse"></div>
                <div className="flex gap-1">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}

/**
 * Gallery Skeleton
 * For SwayingGallery loading state
 */
export function GallerySkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            ))}
        </div>
    );
}

/**
 * Text Skeleton
 * For loading text content
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ${i === lines - 1 ? 'w-2/3' : 'w-full'
                        }`}
                ></div>
            ))}
        </div>
    );
}
