/**
 * Database — Unified database abstraction layer.
 *
 * Menyediakan singleton `db` yang merujuk ke backend Cloudflare D1.
 * Mendukung API `db.ref(path)` untuk path-based CRUD operations.
 * Hanya berjalan di server (`import 'server-only'`).
 *
 * @module database
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import {
  compareAndSetD1Value,
  deleteD1Value,
  getAllD1Values,
  getD1Value,
  replaceAllD1Values,
  setD1Value,
} from '@/lib/cloudflareD1';

type BackendName = 'cloudflare-d1';
type DataMap = Record<string, unknown>;

interface QueryOptions {
  orderByChild?: string;
  equalToSet?: boolean;
  equalTo?: unknown;
  limitToLast?: number;
}

export interface DatabaseSnapshotLike {
  val(): any;
  exists(): boolean;
  numChildren(): number;
  forEach(callback: (snapshot: DatabaseSnapshotLike) => boolean | void): boolean;
}

export interface DatabaseReferenceLike {
  key: string | null;
  child(path: string): DatabaseReferenceLike;
  orderByChild(child: string): DatabaseReferenceLike;
  equalTo(value: unknown): DatabaseReferenceLike;
  limitToLast(limit: number): DatabaseReferenceLike;
  once(eventType: 'value'): Promise<DatabaseSnapshotLike>;
  set(value: unknown): Promise<void>;
  update(value: Record<string, any>): Promise<void>;
  remove(): Promise<void>;
  push(value?: unknown): Promise<DatabaseReferenceLike>;
  transaction(
    updateFn: (currentValue: any) => any
  ): Promise<{ committed: boolean; snapshot: DatabaseSnapshotLike }>;
}

export interface DatabaseLike {
  ref(path?: string): DatabaseReferenceLike;
}

export function getDatabaseBackend(): BackendName {
  return 'cloudflare-d1';
}

function normalizePath(path?: string | null) {
  return (path || '').replace(/^\/+|\/+$/g, '');
}

function splitPath(path?: string | null) {
  const normalized = normalizePath(path);
  return normalized ? normalized.split('/').filter(Boolean) : [];
}

function clone<T>(value: T): T {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function isObjectRecord(value: unknown): value is DataMap {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getNested(root: unknown, segments: string[]) {
  let cursor = root;
  for (const segment of segments) {
    if (!isObjectRecord(cursor) && !Array.isArray(cursor)) return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

function setNested(root: unknown, segments: string[], value: unknown) {
  if (segments.length === 0) return value;

  const [head, ...tail] = segments;
  const base: DataMap = isObjectRecord(root) ? { ...root } : {};

  if (tail.length === 0) {
    if (value === null || value === undefined) {
      delete base[head];
    } else {
      base[head] = value;
    }
    return base;
  }

  base[head] = setNested(base[head], tail, value);
  return base;
}

function countChildren(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (isObjectRecord(value)) return Object.keys(value).length;
  return value === null || value === undefined ? 0 : 1;
}

function compareValues(a: unknown, b: unknown) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''));
}

class D1Snapshot implements DatabaseSnapshotLike {
  constructor(
    private readonly value: unknown,
    private readonly keyValue: string | null = null
  ) {}

  val(): any {
    return clone(this.value);
  }

  exists() {
    return this.value !== null && this.value !== undefined;
  }

  numChildren() {
    return countChildren(this.value);
  }

  forEach(callback: (snapshot: DatabaseSnapshotLike) => boolean | void) {
    if (!isObjectRecord(this.value)) return false;

    for (const [key, value] of Object.entries(this.value)) {
      const shouldCancel = callback(new D1Snapshot(value, key));
      if (shouldCancel === true) return true;
    }

    return false;
  }

  get key() {
    return this.keyValue;
  }
}

class D1Reference implements DatabaseReferenceLike {
  readonly key: string | null;

  constructor(
    private readonly path = '',
    private readonly queryOptions: QueryOptions = {}
  ) {
    const segments = splitPath(path);
    this.key = segments.at(-1) ?? null;
  }

  child(path: string) {
    return new D1Reference([this.path, path].filter(Boolean).join('/'), this.queryOptions);
  }

  orderByChild(child: string) {
    return new D1Reference(this.path, { ...this.queryOptions, orderByChild: child });
  }

  equalTo(value: unknown) {
    return new D1Reference(this.path, { ...this.queryOptions, equalToSet: true, equalTo: value });
  }

  limitToLast(limit: number) {
    return new D1Reference(this.path, { ...this.queryOptions, limitToLast: limit });
  }

  async once(eventType: 'value') {
    if (eventType !== 'value') {
      throw new Error(`Unsupported database event type: ${eventType}`);
    }

    const value = await this.readValue();
    return new D1Snapshot(this.applyQuery(value), this.key);
  }

  async set(value: unknown) {
    await this.writeValue(value);
  }

  async update(values: Record<string, any>) {
    const basePath = normalizePath(this.path);
    const updates = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        [basePath, key].filter(Boolean).join('/'),
        value,
      ])
    );

    await applyD1Updates(updates);
  }

  async remove() {
    await this.writeValue(null);
  }

  async push(value?: unknown) {
    const id = `push-${Date.now()}-${crypto.randomUUID()}`;
    const childRef = this.child(id);
    if (arguments.length > 0) {
      await childRef.set(value);
    }
    return childRef;
  }

  async transaction(updateFn: (currentValue: any) => any) {
    const MAX_RETRIES = 3;
    const segments = splitPath(this.path);

    // Root-level transaction (no path) requires bulk replace.
    // We cannot CAS the entire table, so fall through to simple write.
    if (segments.length === 0) {
      const currentValue = await this.readValue();
      const nextValue = updateFn(clone(currentValue));
      if (nextValue === undefined) {
        return { committed: false, snapshot: new D1Snapshot(currentValue, this.key) };
      }
      await this.writeValue(nextValue);
      return { committed: true, snapshot: new D1Snapshot(nextValue, this.key) };
    }

    const [topLevelKey, ...rest] = segments;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Read the full top-level D1 row to get a consistent snapshot for CAS.
      const rawRows = await import('@/lib/cloudflareD1').then((m) =>
        m.queryD1<{ value: string }>(`SELECT value FROM app_kv WHERE key = ? LIMIT 1`, [
          topLevelKey,
        ])
      );
      const rawJson = rawRows[0]?.value ?? null;
      const topValue = rawJson !== null ? JSON.parse(rawJson) : null;
      const nestedValue = rest.length === 0 ? topValue : getNested(topValue, rest);

      const nextNested = updateFn(clone(nestedValue));
      if (nextNested === undefined) {
        return { committed: false, snapshot: new D1Snapshot(nestedValue, this.key) };
      }

      const nextTop = rest.length === 0 ? nextNested : setNested(topValue ?? {}, rest, nextNested);

      // CAS at the top-level key prevents lost updates from concurrent transactions.
      const expectedJson = rawJson; // The raw string we read is the CAS basis

      if (expectedJson === null) {
        // Row didn't exist — insert only if it still doesn't
        const ok = await compareAndSetD1Value(topLevelKey, null, nextTop);
        if (ok) {
          return { committed: true, snapshot: new D1Snapshot(nextNested, this.key) };
        }
      } else {
        const ok = await compareAndSetD1Value(topLevelKey, JSON.parse(expectedJson), nextTop);
        if (ok) {
          return { committed: true, snapshot: new D1Snapshot(nextNested, this.key) };
        }
      }
      // CAS failed — another writer modified the row; retry
      if (attempt > 0) {
        console.warn(
          `[Database] CAS contention on key "${topLevelKey}" (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
      }
    }

    // All retries exhausted
    console.error(
      `[Database] Transaction failed after ${MAX_RETRIES} CAS retries on key "${topLevelKey}" (path: ${this.path})`
    );
    return { committed: false, snapshot: new D1Snapshot(null, this.key) };
  }

  private async readValue() {
    const segments = splitPath(this.path);
    if (segments.length === 0) {
      return getAllD1Values();
    }

    const [topLevelKey, ...rest] = segments;
    const topValue = await getD1Value(topLevelKey);
    return rest.length === 0 ? topValue : getNested(topValue, rest);
  }

  private async writeValue(value: unknown) {
    const segments = splitPath(this.path);

    if (segments.length === 0) {
      if (!isObjectRecord(value)) {
        throw new Error('Root database writes require an object value');
      }
      await replaceAllD1Values(value);
      return;
    }

    const [topLevelKey, ...rest] = segments;
    if (rest.length === 0) {
      if (value === null || value === undefined) {
        await deleteD1Value(topLevelKey);
      } else {
        await setD1Value(topLevelKey, value);
      }
      return;
    }

    const currentTopValue = await getD1Value(topLevelKey);
    const nextTopValue = setNested(currentTopValue ?? {}, rest, value);
    await setD1Value(topLevelKey, nextTopValue);
  }

  private applyQuery(value: unknown) {
    const { orderByChild, equalToSet, equalTo, limitToLast } = this.queryOptions;
    if (!isObjectRecord(value) || (!orderByChild && !equalToSet && !limitToLast)) {
      return value;
    }

    let entries = Object.entries(value);
    if (orderByChild) {
      const childPath = splitPath(orderByChild);
      entries = entries.sort(([, left], [, right]) =>
        compareValues(getNested(left, childPath), getNested(right, childPath))
      );
    }

    if (equalToSet) {
      const childPath = splitPath(orderByChild || '');
      entries = entries.filter(([, row]) => {
        const comparable = childPath.length > 0 ? getNested(row, childPath) : row;
        return comparable === equalTo;
      });
    }

    if (limitToLast && entries.length > limitToLast) {
      entries = entries.slice(entries.length - limitToLast);
    }

    if ((orderByChild || equalToSet || limitToLast) && entries.length === 0) {
      return null;
    }

    return Object.fromEntries(entries);
  }
}

class D1Database implements DatabaseLike {
  ref(path?: string) {
    return new D1Reference(normalizePath(path));
  }
}

async function applyD1Updates(updates: Record<string, unknown>) {
  const grouped = new Map<string, Array<{ rest: string[]; value: unknown }>>();

  for (const [path, value] of Object.entries(updates)) {
    const [topLevelKey, ...rest] = splitPath(path);
    if (!topLevelKey) continue;
    const entries = grouped.get(topLevelKey) ?? [];
    entries.push({ rest, value });
    grouped.set(topLevelKey, entries);
  }

  for (const [topLevelKey, entries] of grouped) {
    let topValue = await getD1Value(topLevelKey);

    for (const { rest, value } of entries) {
      if (rest.length === 0) {
        topValue = value;
      } else {
        topValue = setNested(topValue ?? {}, rest, value);
      }
    }

    if (topValue === null || topValue === undefined) {
      await deleteD1Value(topLevelKey);
    } else {
      await setD1Value(topLevelKey, topValue);
    }
  }
}

const d1Database = new D1Database();

export const db = new Proxy({} as DatabaseLike, {
  get(_target, prop) {
    const value = Reflect.get(d1Database, prop);
    return typeof value === 'function' ? value.bind(d1Database) : value;
  },
});
