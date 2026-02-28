'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, MapPin, AlertCircle, HelpCircle, X, RefreshCw, Shield } from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error' | 'unsupported' | 'checking';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationError, setLocationError] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const router = useRouter();

  // Fix hydration mismatch by only enabling dynamic logic after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch CSRF token on load
  const fetchCSRF = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/login', {
        credentials: 'include', // Important: include cookies
      });
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.csrfToken);
        console.log('CSRF token fetched successfully');
      }
    } catch (e) {
      console.error('CSRF fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchCSRF();
  }, [fetchCSRF]);

  // Check permission status using Permissions API
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return null;
    }
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (e) {
      console.error('Permission query error:', e);
      return null;
    }
  }, []);

  // Request geolocation
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      setLocationError('Browser Anda tidak mendukung geolocation.');
      return;
    }

    setLocationStatus('requesting');
    setLocationError('');

    // First check permission status
    const permissionState = await checkPermission();
    console.log('Geolocation permission state:', permissionState);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', position.coords);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus('granted');
        setError('');
      },
      (err) => {
        console.error('Geolocation error:', err.code, err.message);
        
        let errorMsg = 'Error tidak diketahui';
        let status: LocationStatus = 'error';

        switch (err.code) {
          case 1: // PERMISSION_DENIED
            status = 'denied';
            errorMsg = 'Izin lokasi ditolak. Klik "Reset Izin" di pengaturan browser lalu refresh halaman.';
            break;
          case 2: // POSITION_UNAVAILABLE
            status = 'error';
            errorMsg = 'Lokasi tidak tersedia. Pastikan GPS/GNSS aktif dan Anda berada di area dengan sinyal baik.';
            break;
          case 3: // TIMEOUT
            status = 'error';
            errorMsg = 'Timeout mendeteksi lokasi. Coba lagi atau refresh halaman.';
            break;
          default:
            status = 'error';
            errorMsg = `Error: ${err.message || 'Unknown error'}`;
        }

        setLocationStatus(status);
        setLocationError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout
        maximumAge: 0,
      }
    );
  }, [checkPermission]);

  // Check permission on mount and request location
  useEffect(() => {
    if (mounted) {
      checkPermission().then((state) => {
        console.log('Initial permission state:', state);
        if (state === 'granted') {
          // Permission already granted, request location immediately
          requestLocation();
        } else if (state === 'prompt') {
          // Need to prompt user
          requestLocation();
        } else if (state === 'denied') {
          setLocationStatus('denied');
          setLocationError('Izin lokasi ditolak. Klik "Reset Izin" di pengaturan browser lalu refresh halaman.');
        } else {
          // Unknown state, try anyway
          requestLocation();
        }
      });
    }
  }, [mounted, checkPermission, requestLocation]);

  // Watch for permission changes
  useEffect(() => {
    if (!navigator.permissions || !navigator.permissions.query) return;

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
      permissionStatus = status;
      status.onchange = () => {
        console.log('Permission changed to:', status.state);
        if (status.state === 'granted') {
          requestLocation();
        } else if (status.state === 'denied') {
          setLocationStatus('denied');
          setLocationError('Izin lokasi ditolak. Klik "Reset Izin" di pengaturan browser lalu refresh halaman.');
        }
      };
    });

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [requestLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      setError('⚠️ Lokasi wajib diaktifkan untuk login.');
      return;
    }

    setLoading(true);
    setError('');

    // Refresh CSRF token before login to ensure it's valid
    // Gunakan return value langsung, bukan state yang async
    let currentToken = csrfToken;
    try {
      const res = await fetch('/api/admin/login', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        currentToken = data.csrfToken;
        setCsrfToken(data.csrfToken); // Update state untuk konsistensi UI
      }
    } catch (e) {
      console.error('CSRF fetch error:', e);
    }
    
    if (!currentToken) {
      setError('⚠️ CSRF token tidak tersedia. Silakan refresh halaman.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': currentToken,
        },
        body: JSON.stringify({
          password,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
        }),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        // Small delay to discourage brute-force attempts
        await new Promise((resolve) => setTimeout(resolve, 400));

        let message = 'Login failed. Please try again.';
        if (response.status === 500) {
          message = '⚠️ Backend Error: Masalah koneksi database (Internal Server Error). Pastikan server stabil.';
        } else {
          try {
            const data = await response.json();
            if (response.status === 401) {
              message = data?.error || 'Incorrect password. Please try again.';
            } else if (data?.error) {
              message = data.error;
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
        setError(message);
      }
    } catch {
      setError('Unable to login. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAccuracy = (accuracy: number) => {
    if (accuracy < 10) return 'Sangat Akurat';
    if (accuracy < 50) return `±${Math.round(accuracy)}m`;
    return `±${Math.round(accuracy / 10) * 10}m`;
  };

  const isLoginEnabled = mounted && locationStatus === 'granted' && location !== null;

  const handleRefreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your admin password to access the dashboard
          </p>
        </div>

        {/* Location Status Indicator */}
        <div className={`rounded-lg border p-4 ${
          locationStatus === 'granted' 
            ? 'bg-green-50 border-green-200' 
            : locationStatus === 'denied' || locationStatus === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  locationStatus === 'granted'
                    ? 'bg-green-100 text-green-600'
                    : locationStatus === 'denied'
                    ? 'bg-red-100 text-red-600'
                    : locationStatus === 'error'
                    ? 'bg-orange-100 text-orange-600'
                    : locationStatus === 'requesting'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {locationStatus === 'granted' ? (
                  <MapPin className="w-5 h-5" />
                ) : locationStatus === 'denied' ? (
                  <Shield className="w-5 h-5" />
                ) : locationStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : locationStatus === 'requesting' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  locationStatus === 'granted' 
                    ? 'text-green-800' 
                    : locationStatus === 'denied' || locationStatus === 'error'
                    ? 'text-red-800'
                    : 'text-gray-900'
                }`}>
                  {locationStatus === 'idle' && 'Memeriksa izin lokasi...'}
                  {locationStatus === 'checking' && 'Memeriksa izin lokasi...'}
                  {locationStatus === 'requesting' && 'Mendeteksi lokasi...'}
                  {locationStatus === 'granted' && 'Lokasi berhasil dideteksi'}
                  {locationStatus === 'denied' && '✗ Izin lokasi ditolak'}
                  {locationStatus === 'error' && '⚠ Gagal mendeteksi lokasi'}
                  {locationStatus === 'unsupported' && '✗ Browser tidak support'}
                </p>
                {location && (
                  <p className="text-xs text-green-600">
                    Akurasi: {formatAccuracy(location.accuracy)}
                  </p>
                )}
                {locationError && (
                  <p className="text-xs text-red-600 mt-1 max-w-[200px]">
                    {locationError}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Panduan mengaktifkan lokasi"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons based on status */}
          {(locationStatus === 'denied' || locationStatus === 'error') && (
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setLocationError('');
                  requestLocation();
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={handleRefreshPage}
                className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Halaman
              </button>
            </div>
          )}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
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
                disabled={!isLoginEnabled}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={!isLoginEnabled}
                className="flex items-center justify-center px-3 border border-gray-300 rounded-md bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <div className="text-red-600 text-sm text-center" role="alert">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!mounted || loading || !isLoginEnabled}
              className={`group w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLoginEnabled
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="h-4 w-4 text-blue-200" />
              )}
              <span suppressHydrationWarning>
                {loading
                  ? 'Signing in...'
                  : !isLoginEnabled
                  ? 'Aktifkan Lokasi untuk Login'
                  : 'Sign in'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Cara Mengaktifkan Lokasi
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 font-medium">
                  ⚠️ Masalah Umum di Localhost
                </p>
                <p className="text-red-700 mt-1">
                  Chrome kadang memblokir geolocation di localhost meski sudah di-allow. 
                  Solusi: <strong>Refresh halaman (F5)</strong> atau klik tombol "Coba Lagi" setelah mengizinkan lokasi.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">Langkah 1: Allow di Browser</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Klik ikon gembok (🔒) atau lokasi (📍) di sebelah kiri address bar</li>
                  <li>Pastikan "Location" di-set ke "Allow"</li>
                  <li>Jika ada popup "Allow... to know your location", klik "Allow"</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">Langkah 2: Windows Location</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Buka Windows Settings → Privacy & Security → Location</li>
                  <li>Pastikan "Location services" ON</li>
                  <li>Scroll ke bawah, cari Chrome/Edge Anda, pastikan ON</li>
                </ol>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">Langkah 3: Reset & Refresh</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Klik ikon gembok → "Reset permission" atau "Site settings"</li>
                  <li>Set Location ke "Allow"</li>
                  <li><strong>Refresh halaman (F5)</strong></li>
                  <li>Klik "Allow" jika ada popup</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800">
                  <strong>Tips:</strong> Jika masih gagal, coba:
                </p>
                <ul className="list-disc list-inside mt-1 text-yellow-700">
                  <li>Tutup browser dan buka lagi</li>
                  <li>Buka di tab baru: <code>chrome://settings/content/location</code></li>
                  <li>Hapus localhost dari blocked list</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
