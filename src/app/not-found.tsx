import { Link } from 'next-view-transitions';

// Server Component — tidak butuh state/effect, jadi tidak perlu 'use client'.
// Ini menghemat JS bundle untuk halaman 404 yang seharusnya ringan.
export default function NotFound() {
  return (
    <div className="container">
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          <h1 className="mb-4 text-6xl font-bold text-gray-900 dark:text-white">404</h1>

          <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Halaman Tidak Ditemukan
          </h2>

          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Halaman yang kamu cari tidak ada atau telah dipindahkan.
          </p>

          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="rounded-md bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
            >
              Kembali ke Beranda
            </Link>

            <Link
              href="/projects"
              className="rounded-md border border-gray-300 px-6 py-3 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Lihat Semua Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
