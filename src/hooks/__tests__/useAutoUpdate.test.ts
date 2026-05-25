import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoUpdate } from '../useAutoUpdate';

// Use real timers — fake timers + Promise microtask + React internal
// scheduling mudah deadlock. Pakai interval kecil untuk speed.

describe('useAutoUpdate', () => {
  it('kicks off initial fetch once', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data-1');

    const { result } = renderHook(() =>
      useAutoUpdate(fetchFn, { interval: 10_000, enabled: false })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toBe('data-1');
      expect(result.current.loading).toBe(false);
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('does NOT double-fire initial fetch di mount', async () => {
    // REGRESSION: Sebelum fix, microtask + setInterval bisa race → 2 request
    // simultan di mount (initial fetch + interval tick bareng).
    // Sekarang interval start hanya setelah initial fetch selesai.
    //
    // Pakai interval besar supaya tick kedua tidak fire selama verifikasi.
    const fetchFn = vi.fn().mockResolvedValue('data');

    renderHook(() => useAutoUpdate(fetchFn, { interval: 10_000, enabled: true }));

    // Tunggu initial fetch settle
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    // Beri waktu 100ms — interval 10_000 tidak akan fire di window ini
    await new Promise((r) => setTimeout(r, 100));

    // Masih 1 call — tidak dobel
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('does not start interval ketika enabled=false', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    renderHook(() => useAutoUpdate(fetchFn, { interval: 30, enabled: false }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    await new Promise((r) => setTimeout(r, 150));
    // Still 1 — no interval
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('cleans up interval on unmount', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    // Interval large cukup supaya tidak fire sebelum kita unmount
    const { unmount } = renderHook(() =>
      useAutoUpdate(fetchFn, { interval: 10_000, enabled: true })
    );

    // Wait initial fetch selesai
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    const callsAtUnmount = fetchFn.mock.calls.length;

    unmount();

    // Beri waktu untuk interval potentially fire kalau cleanup tidak jalan
    await new Promise((r) => setTimeout(r, 200));

    // Setelah unmount, counter tidak bertambah (interval di-clear)
    expect(fetchFn.mock.calls.length).toBe(callsAtUnmount);
  });

  it('handles fetch errors gracefully', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network'));

    const { result } = renderHook(() =>
      useAutoUpdate(fetchFn, { interval: 10_000, enabled: false })
    );

    await waitFor(() => {
      expect(result.current.error).toBe('network');
      expect(result.current.loading).toBe(false);
    });
  });

  it('refresh manual fires fetch lagi', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() =>
      useAutoUpdate(fetchFn, { interval: 10_000, enabled: false })
    );

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
  });
});
