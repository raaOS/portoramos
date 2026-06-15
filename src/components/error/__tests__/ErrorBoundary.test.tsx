import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  DesktopErrorBoundary,
  ErrorBoundary,
  SectionErrorBoundary,
  useAsyncErrorHandler,
} from '../ErrorBoundary';

function Thrower(): never {
  throw new Error('render failed');
}

describe('ErrorBoundary components', () => {
  it('menampilkan fallback custom dan memanggil onError', () => {
    const onError = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Fallback custom</div>} onError={onError}>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Fallback custom')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('menampilkan fallback default dan menjalankan reload', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Refresh Page'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(reloadSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('menampilkan fallback desktop dan menangani restart atau safe mode', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadSpy = vi.fn();
    const originalHref = window.location.href;
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy, href: originalHref },
      writable: true,
    });

    render(
      <DesktopErrorBoundary>
        <Thrower />
      </DesktopErrorBoundary>
    );

    fireEvent.click(screen.getByText('Restart System'));
    fireEvent.click(screen.getByText('Safe Mode'));

    expect(screen.getByText('System Error')).toBeInTheDocument();
    expect(reloadSpy).toHaveBeenCalled();
    expect(window.location.href).toContain('/');
    consoleErrorSpy.mockRestore();
  });

  it('menampilkan fallback section default dan mendukung try again', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SectionErrorBoundary sectionName="Projects">
        <Thrower />
      </SectionErrorBoundary>
    );

    expect(screen.getByText('⚠️ Projects failed to load')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try Again'));
    consoleErrorSpy.mockRestore();
  });
});

describe('useAsyncErrorHandler', () => {
  it('mengembalikan hasil sukses dan null ketika promise gagal', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function HookHarness() {
      const { wrapAsync } = useAsyncErrorHandler();

      return (
        <button
          onClick={async () => {
            await wrapAsync(Promise.resolve('ok'), 'success');
            await wrapAsync(Promise.reject(new Error('failed')), 'failure');
          }}
        >
          Run
        </button>
      );
    }

    render(<HookHarness />);
    fireEvent.click(screen.getByText('Run'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    consoleErrorSpy.mockRestore();
  });
});
