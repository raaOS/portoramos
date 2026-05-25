'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'error'
  | 'unsupported'
  | 'checking';

// Use syncExternalStore to avoid setState in effect
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;
const subscribe = () => () => {};

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string>('');

  // Use useSyncExternalStore instead of setState in useEffect
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  // Check permission status using Permissions API
  const checkPermission = useCallback(async (): Promise<string | null> => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return null;
    }
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state;
    } catch (e) {
      console.error('Permission query error:', e);
      return null;
    }
  }, []);

  // Request geolocation
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      setError('Browser Anda tidak mendukung geolocation.');
      return;
    }

    setStatus('requesting');
    setError('');

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
        setStatus('granted');
        setError('');
      },
      (err) => {
        console.error('Geolocation error:', err.code, err.message);

        let errorMsg = 'Error tidak diketahui';
        let newStatus: LocationStatus = 'error';

        switch (err.code) {
          case 1: // PERMISSION_DENIED
            newStatus = 'denied';
            errorMsg =
              'Izin lokasi ditolak. Klik "Reset Izin" di pengaturan browser lalu refresh halaman.';
            break;
          case 2: // POSITION_UNAVAILABLE
            newStatus = 'error';
            errorMsg =
              'Lokasi tidak tersedia. Pastikan GPS/GNSS aktif dan Anda berada di area dengan sinyal baik.';
            break;
          case 3: // TIMEOUT
            newStatus = 'error';
            errorMsg = 'Timeout mendeteksi lokasi. Coba lagi atau refresh halaman.';
            break;
          default:
            newStatus = 'error';
            errorMsg = `Error: ${err.message || 'Unknown error'}`;
        }

        setStatus(newStatus);
        setError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }, [checkPermission]);

  // Check permission on mount and request location
  useEffect(() => {
    if (!mounted) return;

    checkPermission().then((state) => {
      console.log('Initial permission state:', state);
      if (state === 'granted') {
        requestLocation();
      } else if (state === 'prompt') {
        requestLocation();
      } else if (state === 'denied') {
        setStatus('denied');
        setError(
          'Izin lokasi ditolak. Klik "Reset Izin" di pengaturan browser lalu refresh halaman.'
        );
      } else {
        requestLocation();
      }
    });
  }, [mounted, checkPermission, requestLocation]);

  // Watch for permission changes
  useEffect(() => {
    if (!navigator.permissions || !navigator.permissions.query) return;

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((permStatus) => {
      permissionStatus = permStatus;
      permStatus.onchange = () => {
        console.log('Permission changed to:', permStatus.state);
        if (permStatus.state === 'granted') {
          requestLocation();
        } else if (permStatus.state === 'denied') {
          setStatus('denied');
          setError(
            'Izin lokasi ditolak. Klik "Reset Izin" di pengaturan browser lalu refresh halaman.'
          );
        }
      };
    });

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [requestLocation]);

  const formatAccuracy = (accuracy: number): string => {
    if (accuracy < 10) return 'Sangat Akurat';
    if (accuracy < 50) return `±${Math.round(accuracy)}m`;
    return `±${Math.round(accuracy / 10) * 10}m`;
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const isEnabled = mounted && status === 'granted' && location !== null;

  return {
    location,
    status,
    error,
    mounted,
    isEnabled,
    requestLocation,
    formatAccuracy,
    refreshPage,
  };
}
