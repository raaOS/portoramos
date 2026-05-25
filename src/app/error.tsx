'use client';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-semibold">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  );
}
