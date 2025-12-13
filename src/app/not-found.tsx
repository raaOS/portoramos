'use client';

import Link from 'next/link';

export default function NotFound() {

  return (
    <div className="container">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>

          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Page Not Found
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </Link>

            <Link
              href="/works"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              View All Works
            </Link>
          </div>
        </div>


      </div>
    </div>
  );
}