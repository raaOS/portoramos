export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-5 space-y-12">
                    {/* Headline Skeleton */}
                    <div className="space-y-4">
                        <div className="h-12 w-3/4 bg-white/5 rounded animate-pulse" />
                        <div className="h-12 w-2/3 bg-white/5 rounded animate-pulse" />
                    </div>

                    {/* Bio Skeleton */}
                    <div className="space-y-4">
                        <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                        <div className="h-4 w-11/12 bg-white/5 rounded animate-pulse" />
                        <div className="h-4 w-10/12 bg-white/5 rounded animate-pulse" />
                    </div>

                    {/* Services Skeleton */}
                    <div className="space-y-6 pt-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
                                <div className="h-6 w-1/3 bg-white/5 rounded animate-pulse" />
                                <div className="h-6 w-6 bg-white/5 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-7 space-y-12">
                    <div className="aspect-[4/5] w-full bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
