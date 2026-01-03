'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const router = useRouter();

  // Request location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationError('');
        },
        (err) => {
          console.log('Location access denied or unavailable:', err);
          if (err.code === 1) { // PERMISSION_DENIED
            setLocationError('⚠️ Akses lokasi wajib diizinkan untuk verifikasi keamanan.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...coords })
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        // Small delay to discourage brute-force attempts
        await new Promise((resolve) => setTimeout(resolve, 400));

        let message = 'Login failed. Please try again.';
        try {
          const data = await response.json();
          if (response.status === 401) {
            message = data?.error || 'Incorrect password. Please try again.';
          } else if (data?.error) {
            message = data.error;
          }
        } catch {
          // Ignore JSON parse errors and fall back to generic message
        }
        setError(message);
      }
    } catch {
      setError('Unable to login. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your admin password to access the dashboard
          </p>
          {locationError && (
            <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-2 text-yellow-700 text-xs text-center">
              {locationError}
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="flex gap-2">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex items-center justify-center px-3 border border-gray-300 rounded-md bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-red-600 text-sm text-center"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !!locationError}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${locationError
                  ? 'bg-red-600 hover:bg-red-700 cursor-not-allowed focus:ring-red-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50'
                }`}
            >
              <span className="absolute left-4 flex items-center">
                {locationError ? (
                  <Lock className="h-4 w-4 text-red-200" />
                ) : loading ? (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
              </span>
              <span>
                {locationError
                  ? 'Login Locked (Location Required)'
                  : loading
                    ? 'Signing in...'
                    : 'Sign in'
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
