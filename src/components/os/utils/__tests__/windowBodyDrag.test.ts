import type React from 'react';
import { describe, expect, it } from 'vitest';
import { shouldStartWindowBodyDrag } from '../windowBodyDrag';

function createPointerEvent(
  target: Element,
  overrides: Partial<React.PointerEvent<HTMLElement>> = {}
): React.PointerEvent<HTMLElement> {
  return {
    target,
    button: 0,
    isPrimary: true,
    defaultPrevented: false,
    clientX: 0,
    clientY: 0,
    ...overrides,
  } as React.PointerEvent<HTMLElement>;
}

describe('shouldStartWindowBodyDrag', () => {
  it('allows dragging from an empty layout surface', () => {
    const boundary = document.createElement('div');
    const surface = document.createElement('div');
    boundary.appendChild(surface);

    expect(shouldStartWindowBodyDrag(createPointerEvent(surface), boundary)).toBe(true);
  });

  it('blocks dragging from interactive controls', () => {
    const boundary = document.createElement('div');
    const button = document.createElement('button');
    boundary.appendChild(button);

    expect(shouldStartWindowBodyDrag(createPointerEvent(button), boundary)).toBe(false);
  });

  it('blocks dragging from readable text', () => {
    const boundary = document.createElement('div');
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Selectable project description';
    boundary.appendChild(paragraph);

    expect(shouldStartWindowBodyDrag(createPointerEvent(paragraph), boundary)).toBe(false);
  });

  it('blocks dragging when an ancestor opts out', () => {
    const boundary = document.createElement('div');
    const excluded = document.createElement('div');
    const child = document.createElement('div');
    excluded.dataset.noWindowDrag = '';
    excluded.appendChild(child);
    boundary.appendChild(excluded);

    expect(shouldStartWindowBodyDrag(createPointerEvent(child), boundary)).toBe(false);
  });

  it('blocks pointer and text cursors', () => {
    const boundary = document.createElement('div');
    const pointerSurface = document.createElement('div');
    const textSurface = document.createElement('div');
    pointerSurface.style.cursor = 'pointer';
    textSurface.style.cursor = 'text';
    boundary.append(pointerSurface, textSurface);

    expect(shouldStartWindowBodyDrag(createPointerEvent(pointerSurface), boundary)).toBe(false);
    expect(shouldStartWindowBodyDrag(createPointerEvent(textSurface), boundary)).toBe(false);
  });

  it('blocks targets outside the drag boundary', () => {
    const boundary = document.createElement('div');
    const outside = document.createElement('div');

    expect(shouldStartWindowBodyDrag(createPointerEvent(outside), boundary)).toBe(false);
  });

  it('blocks non-primary or already prevented pointer events', () => {
    const boundary = document.createElement('div');
    const surface = document.createElement('div');
    boundary.appendChild(surface);

    expect(shouldStartWindowBodyDrag(createPointerEvent(surface, { button: 2 }), boundary)).toBe(
      false
    );
    expect(
      shouldStartWindowBodyDrag(createPointerEvent(surface, { defaultPrevented: true }), boundary)
    ).toBe(false);
  });
});
