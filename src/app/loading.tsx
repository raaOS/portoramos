export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
    </div>
  );
}
