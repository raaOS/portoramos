import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import {
  UnifiedZIndexProvider,
  useUnifiedZIndex,
  useUnifiedZIndexActions,
  useZIndexFor,
} from '../UnifiedZIndexContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UnifiedZIndexProvider>{children}</UnifiedZIndexProvider>
);

describe('UnifiedZIndexContext', () => {
  describe('bringToFront', () => {
    it('assigns increasing z-index', () => {
      const { result } = renderHook(() => useUnifiedZIndex(), { wrapper });

      let a = 0;
      let b = 0;
      act(() => {
        a = result.current.bringToFront('win-a', 'window');
        b = result.current.bringToFront('win-b', 'window');
      });

      expect(b).toBeGreaterThan(a);
    });

    it('tracks top element', () => {
      const { result } = renderHook(() => useUnifiedZIndex(), { wrapper });

      act(() => {
        result.current.bringToFront('a', 'window');
        result.current.bringToFront('b', 'window');
        result.current.bringToFront('a', 'window');
      });

      expect(result.current.isOnTop('a')).toBe(true);
      expect(result.current.isOnTop('b')).toBe(false);
    });
  });

  describe('useZIndexFor (per-id subscription)', () => {
    it('returns BASE_Z_INDEX saat id belum registered', () => {
      const { result } = renderHook(() => useZIndexFor('not-registered'), { wrapper });
      expect(result.current).toBe(100); // BASE_Z_INDEX
    });

    it('re-renders ONLY saat zIndex untuk id-nya berubah', () => {
      // PERFORMANCE FIX VERIFICATION: Target komponen hanya re-render
      // kalau zIndex-nya benar-benar ter-update.
      const aRenderCount = { current: 0 };
      const bRenderCount = { current: 0 };

      function Probe({ id, counter }: { id: string; counter: { current: number } }) {
        const z = useZIndexFor(id);
        counter.current += 1;
        return <div data-testid={id}>{z}</div>;
      }

      let actionsRef: ReturnType<typeof useUnifiedZIndexActions> | null = null;

      function Actions() {
        actionsRef = useUnifiedZIndexActions();
        return null;
      }

      render(
        <UnifiedZIndexProvider>
          <Probe id="a" counter={aRenderCount} />
          <Probe id="b" counter={bRenderCount} />
          <Actions />
        </UnifiedZIndexProvider>
      );

      const initialA = aRenderCount.current;
      const initialB = bRenderCount.current;

      act(() => {
        actionsRef!.bringToFront('a', 'window');
      });

      // Probe 'a' harus re-render. Probe 'b' tidak perlu.
      expect(aRenderCount.current).toBeGreaterThan(initialA);
      // `b` boleh re-render 0 kali setelah initial — per-id subscription
      // tidak meneruskan update ke listener id lain.
      expect(bRenderCount.current).toBe(initialB);
    });
  });

  describe('useUnifiedZIndexActions (no subscription)', () => {
    it('tidak re-render saat zIndex berubah', () => {
      const renderCount = { current: 0 };

      function Consumer() {
        useUnifiedZIndexActions();
        renderCount.current += 1;
        return null;
      }

      let actionsRef: ReturnType<typeof useUnifiedZIndexActions> | null = null;

      function Actions() {
        actionsRef = useUnifiedZIndexActions();
        return null;
      }

      render(
        <UnifiedZIndexProvider>
          <Consumer />
          <Actions />
        </UnifiedZIndexProvider>
      );

      const initial = renderCount.current;

      act(() => {
        actionsRef!.bringToFront('any', 'window');
        actionsRef!.bringToFront('another', 'window');
      });

      // Consumer tidak subscribe → tidak re-render
      expect(renderCount.current).toBe(initial);
    });
  });

  describe('register/unregister', () => {
    it('registers elements dengan BASE zIndex sampai bringToFront', () => {
      const { result } = renderHook(() => useUnifiedZIndex(), { wrapper });

      act(() => {
        result.current.registerElement('el-1', 'stickyNote');
      });
      // Register-only: zIndex = BASE (belum promote)
      expect(result.current.getZIndex('el-1')).toBe(100);

      act(() => {
        result.current.bringToFront('el-1', 'stickyNote');
      });
      // Setelah bringToFront: naik di atas BASE
      expect(result.current.getZIndex('el-1')).toBeGreaterThan(100);

      act(() => {
        result.current.unregisterElement('el-1');
      });

      // After unregister, getZIndex falls back to BASE
      expect(result.current.getZIndex('el-1')).toBe(100);
    });
  });

  describe('resetZIndexes', () => {
    it('clears all elements', () => {
      const { result } = renderHook(() => useUnifiedZIndex(), { wrapper });

      act(() => {
        result.current.bringToFront('a', 'window');
        result.current.bringToFront('b', 'window');
        result.current.resetZIndexes();
      });

      expect(result.current.getTopZIndex()).toBe(100);
      expect(result.current.getZIndex('a')).toBe(100);
      expect(result.current.getTopElement()).toBeNull();
    });
  });

  describe('throws outside provider', () => {
    it('useUnifiedZIndex throws tanpa provider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useUnifiedZIndex())).toThrow();
      spy.mockRestore();
    });

    it('useZIndexFor throws tanpa provider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useZIndexFor('x'))).toThrow();
      spy.mockRestore();
    });
  });
});
