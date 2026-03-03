export default function Loading() {
    return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
}
