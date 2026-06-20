import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OSSystemProvider, useOSBoot, useOSMedia, useOSOverlays } from '../OSSystemContext';

describe('OSSystemContext granular subscriptions', () => {
  it('keeps media consumers stable when only overlay state changes', () => {
    const mediaRenderSpy = vi.fn();

    function OverlayController() {
      const overlays = useOSOverlays();
      return (
        <button type="button" onClick={overlays.toggleSpotlight}>
          {String(overlays.showSpotlight)}
        </button>
      );
    }

    function MediaProbe() {
      const { volume } = useOSMedia();
      mediaRenderSpy();
      return <span data-testid="volume">{volume}</span>;
    }

    render(
      <OSSystemProvider>
        <OverlayController />
        <MediaProbe />
      </OSSystemProvider>
    );

    const initialMediaRenders = mediaRenderSpy.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'false' }));

    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByTestId('volume')).toHaveTextContent('50');
    expect(mediaRenderSpy).toHaveBeenCalledTimes(initialMediaRenders);
  });

  it('exposes boot state independently from overlays and media', () => {
    function BootProbe() {
      const boot = useOSBoot();
      return (
        <button type="button" onClick={() => boot.setIsRevealed(true)}>
          {String(boot.isRevealed)}
        </button>
      );
    }

    render(
      <OSSystemProvider>
        <BootProbe />
      </OSSystemProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'false' }));
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('throws granular hooks outside OSSystemProvider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<MediaOutsideProvider />)).toThrow(
      'useOSMedia must be used within OSSystemProvider'
    );

    errorSpy.mockRestore();
  });
});

function MediaOutsideProvider() {
  useOSMedia();
  return null;
}
