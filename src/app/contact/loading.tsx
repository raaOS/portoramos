export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="h-32 w-full flex items-center justify-center">
                    <div className="space-y-4 text-center">
                        <div className="h-10 w-64 bg-white/5 rounded animate-pulse mx-auto" />
                        <div className="h-6 w-48 bg-white/5 rounded animate-pulse mx-auto" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <div className="aspect-video w-full bg-white/5 rounded-2xl animate-pulse" />
                    <div className="aspect-video w-full bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
