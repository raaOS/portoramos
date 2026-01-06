export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-gray-800 rounded mb-4"></div>
                <div className="h-2 w-48 bg-gray-800 rounded"></div>
            </div>
        </div>
    );
}
