type D1Param = string | number | boolean | null;

interface D1QueryResponse<T = Record<string, unknown>> {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: Array<{
    success?: boolean;
    error?: string;
    results?: T[];
  }>;
}

interface D1Config {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

const D1_TABLE_NAME = 'app_kv';
let schemaPromise: Promise<void> | null = null;

function readEnv(name: string) {
  return process.env[name]?.trim() || '';
}

export function getMissingD1EnvKeys() {
  const missing: string[] = [];
  if (!readEnv('CLOUDFLARE_D1_ACCOUNT_ID') && !readEnv('CLOUDFLARE_R2_ACCOUNT_ID')) {
    missing.push('CLOUDFLARE_D1_ACCOUNT_ID');
  }
  if (!readEnv('CLOUDFLARE_D1_DATABASE_ID')) {
    missing.push('CLOUDFLARE_D1_DATABASE_ID');
  }
  if (!readEnv('CLOUDFLARE_D1_API_TOKEN') && !readEnv('CLOUDFLARE_API_TOKEN')) {
    missing.push('CLOUDFLARE_D1_API_TOKEN');
  }
  return missing;
}

export function isD1Configured() {
  return getMissingD1EnvKeys().length === 0;
}

export function getD1Config(): D1Config {
  const accountId = readEnv('CLOUDFLARE_D1_ACCOUNT_ID') || readEnv('CLOUDFLARE_R2_ACCOUNT_ID');
  const databaseId = readEnv('CLOUDFLARE_D1_DATABASE_ID');
  const apiToken = readEnv('CLOUDFLARE_D1_API_TOKEN') || readEnv('CLOUDFLARE_API_TOKEN');

  const missing = getMissingD1EnvKeys();
  if (missing.length > 0) {
    throw new Error(`Cloudflare D1 env is incomplete. Missing: ${missing.join(', ')}`);
  }

  return { accountId, databaseId, apiToken };
}

export async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: D1Param[] = []
): Promise<T[]> {
  const config = getD1Config();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const payload = (await response.json().catch(() => null)) as D1QueryResponse<T> | null;
  if (!response.ok || !payload?.success) {
    const detail = payload?.errors
      ?.map((error) => error.message)
      .filter(Boolean)
      .join('; ');
    throw new Error(`Cloudflare D1 query failed: ${detail || response.statusText}`);
  }

  const firstResult = payload.result?.[0];
  if (firstResult && firstResult.success === false) {
    throw new Error(`Cloudflare D1 SQL failed: ${firstResult.error || sql}`);
  }

  return firstResult?.results ?? [];
}

export async function bootstrapD1Schema() {
  if (!schemaPromise) {
    schemaPromise = queryD1(`
            CREATE TABLE IF NOT EXISTS ${D1_TABLE_NAME} (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            ) STRICT
        `).then(() => undefined);
  }
  return schemaPromise;
}

export async function getD1Value<T = unknown>(key: string): Promise<T | null> {
  const rows = await queryD1<{ value: string }>(
    `SELECT value FROM ${D1_TABLE_NAME} WHERE key = ? LIMIT 1`,
    [key]
  );
  if (!rows[0]) return null;
  return JSON.parse(rows[0].value) as T;
}

export async function getD1Values(keys: string[]): Promise<Record<string, unknown>> {
  if (keys.length === 0) return {};

  const placeholders = keys.map(() => '?').join(', ');
  const rows = await queryD1<{ key: string; value: string }>(
    `SELECT key, value FROM ${D1_TABLE_NAME} WHERE key IN (${placeholders})`,
    keys
  );

  return rows.reduce<Record<string, unknown>>((acc, row) => {
    acc[row.key] = JSON.parse(row.value);
    return acc;
  }, {});
}

export async function getAllD1Values(): Promise<Record<string, unknown>> {
  const rows = await queryD1<{ key: string; value: string }>(
    `SELECT key, value FROM ${D1_TABLE_NAME}`
  );

  return rows.reduce<Record<string, unknown>>((acc, row) => {
    acc[row.key] = JSON.parse(row.value);
    return acc;
  }, {});
}

export async function setD1Value(key: string, value: unknown) {
  await bootstrapD1Schema();
  await queryD1(
    `INSERT INTO ${D1_TABLE_NAME} (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, JSON.stringify(value), new Date().toISOString()]
  );
}

export async function deleteD1Value(key: string) {
  await bootstrapD1Schema();
  await queryD1(`DELETE FROM ${D1_TABLE_NAME} WHERE key = ?`, [key]);
}

export async function replaceAllD1Values(root: Record<string, unknown>) {
  await bootstrapD1Schema();
  await queryD1(`DELETE FROM ${D1_TABLE_NAME}`);

  for (const [key, value] of Object.entries(root)) {
    if (value !== undefined && value !== null) {
      await setD1Value(key, value);
    }
  }
}
