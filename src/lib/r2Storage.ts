import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

type UploadToR2Input = {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
};

type ListR2ObjectsInput = {
  prefix: string;
};

const R2_ENV_KEYS = [
  'CLOUDFLARE_R2_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET',
  'CLOUDFLARE_R2_PUBLIC_BASE_URL',
] as const;

let client: S3Client | null = null;

function readR2Config(): R2Config | null {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ''),
  };
}

export function hasR2StorageEnv() {
  return R2_ENV_KEYS.some((key) => Boolean(process.env[key]));
}

export function isR2StorageConfigured() {
  return Boolean(readR2Config());
}

export function getMissingR2EnvKeys() {
  return R2_ENV_KEYS.filter((key) => !process.env[key]);
}

function getR2Client(config: R2Config) {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return client;
}

function encodeR2Key(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

export function buildR2PublicUrl(key: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error(`Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`);
  }

  return `${config.publicBaseUrl}/${encodeR2Key(key)}`;
}

export function isR2PublicUrl(src?: string | null) {
  const config = readR2Config();
  if (!src || !config) return false;

  return src.startsWith(`${config.publicBaseUrl}/`);
}

export async function uploadToR2({ key, body, contentType, cacheControl }: UploadToR2Input) {
  const config = readR2Config();
  if (!config) {
    throw new Error(`Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`);
  }

  await getR2Client(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
  }));

  return {
    key,
    url: buildR2PublicUrl(key),
  };
}

export async function headR2Object(key: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error(`Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`);
  }

  return getR2Client(config).send(new HeadObjectCommand({
    Bucket: config.bucket,
    Key: key,
  }));
}

export async function getR2Object(key: string, range?: string | null) {
  const config = readR2Config();
  if (!config) {
    throw new Error(`Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`);
  }

  return getR2Client(config).send(new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Range: range || undefined,
  }));
}

export async function deleteFromR2(key: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error(`Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`);
  }

  await getR2Client(config).send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  }));
}

export async function listR2ObjectKeys({ prefix }: ListR2ObjectsInput) {
  const config = readR2Config();
  if (!config) {
    throw new Error(`Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`);
  }

  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getR2Client(config).send(new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));

    response.Contents?.forEach((item) => {
      if (item.Key) keys.push(item.Key);
    });
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}
