import { describe, expect, it } from 'vitest';
import { applyDockItemOrder } from '../dockOrder';

describe('applyDockItemOrder', () => {
  const items = [{ id: 'projects' }, { id: 'about' }, { id: 'contact' }, { id: 'trash' }];

  it('returns the original array when no local order exists', () => {
    expect(applyDockItemOrder(items, [])).toBe(items);
  });

  it('applies known ids and keeps unknown ids stable at the end', () => {
    const result = applyDockItemOrder(items, ['contact', 'projects']);

    expect(result.map((item) => item.id)).toEqual(['contact', 'projects', 'about', 'trash']);
    expect(result).not.toBe(items);
  });

  it('ignores ids that are no longer present in the dock', () => {
    const result = applyDockItemOrder(items, ['missing', 'trash']);

    expect(result.map((item) => item.id)).toEqual(['trash', 'projects', 'about', 'contact']);
  });

  it('preserves the previous duplicate-id behavior by using the last position', () => {
    const result = applyDockItemOrder(items, ['about', 'projects', 'about']);

    expect(result.map((item) => item.id)).toEqual(['projects', 'about', 'contact', 'trash']);
  });
});
