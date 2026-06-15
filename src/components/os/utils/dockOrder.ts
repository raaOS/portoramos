export interface DockOrderItem {
  id: string;
}

export function applyDockItemOrder<T extends DockOrderItem>(
  items: T[],
  orderedIds: readonly string[]
): T[] {
  if (orderedIds.length === 0) return items;

  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));

  return [...items].sort((a, b) => {
    const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 1000;
    const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 1000;
    return indexA - indexB;
  });
}
