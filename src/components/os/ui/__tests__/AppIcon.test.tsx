import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Layers } from 'lucide-react';

import { getDockItemConfig } from '../../utils/dockUtils';
import AppIcon from '../AppIcon';

vi.mock('next/image', () => ({
  default: ({
    alt,
    onError,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) =>
    React.createElement('img', { alt, onError, src, ...props }),
}));

describe('AppIcon', () => {
  it('renders the provided fallback when a custom icon image fails', () => {
    render(
      <AppIcon
        imageUrl="/missing-icon.webp"
        fallback={<span data-testid="fallback-icon">Mission fallback</span>}
      />
    );

    fireEvent.error(screen.getByAltText('icon'));

    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
  });

  it('keeps the default dock icon as fallback for custom icon URLs', () => {
    const fallbackIcon = <AppIcon icon={Layers} color="from-indigo-500 to-purple-600" />;
    const configuredItems = getDockItemConfig(
      [
        {
          id: 'mission-control',
          label: 'Mission Control',
          icon: fallbackIcon,
          onClick: vi.fn(),
        },
      ],
      {
        'mission-control': {
          iconUrl: '/missing-icon.webp',
        },
      }
    );
    const iconElement = configuredItems[0].icon as React.ReactElement<{
      fallback?: React.ReactNode;
      imageUrl?: string;
    }>;

    expect(iconElement.props.imageUrl).toBe('/missing-icon.webp');
    expect(iconElement.props.fallback).toBe(fallbackIcon);
  });
});
