/**
 * R2 Storage — Client SDK untuk Cloudflare R2 (S3-compatible object storage).
 *
 * Menyediakan fungsi upload, download, copy, delete, dan presigned URL
 * untuk interaksi dengan bucket Cloudflare R2. Konfigurasi dibaca dari
 * environment variables (R2_BUCKET, R2_ACCOUNT_ID, dll).
 *
 * @module r2Storage
 */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

function encodeCopySource(bucket: string, key: string) {
  return `${bucket}/${encodeR2Key(key)}`;
}

export function buildR2PublicUrl(key: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
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
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  await getR2Client(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  return {
    key,
    url: buildR2PublicUrl(key),
  };
}

/**
 * Generate a short-lived presigned PUT URL so the browser can upload large
 * binaries (mainly video wallpapers >4.5 MB) directly to R2 without going
 * through the Vercel function body parser, which caps FormData at the
 * platform request body limit.
 *
 * The URL is bound to a specific `key`, `contentType`, and `cacheControl`,
 * so the client cannot upload to arbitrary paths or overwrite arbitrary
 * objects — those are decided on the server before signing.
 */
export async function createR2PresignedPutUrl({
  key,
  contentType,
  cacheControl = 'public, max-age=31536000, immutable',
  expiresInSeconds = 600, // 10 menit, cukup untuk upload + retry sekali.
}: {
  key: string;
  contentType: string;
  cacheControl?: string;
  expiresInSeconds?: number;
}): Promise<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
  cacheControl: string;
  expiresInSeconds: number;
}> {
  const config = readR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: cacheControl,
  });

  const uploadUrl = await getSignedUrl(getR2Client(config), command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    publicUrl: buildR2PublicUrl(key),
    key,
    cacheControl,
    expiresInSeconds,
  };
}

export async function headR2Object(key: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  return getR2Client(config).send(
    new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}

export async function getR2Object(key: string, range?: string | null) {
  const config = readR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  return getR2Client(config).send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Range: range || undefined,
    })
  );
}

export async function deleteFromR2(key: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  await getR2Client(config).send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}

export async function copyR2Object(sourceKey: string, destinationKey: string) {
  const config = readR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  await getR2Client(config).send(
    new CopyObjectCommand({
      Bucket: config.bucket,
      CopySource: encodeCopySource(config.bucket, sourceKey),
      Key: destinationKey,
    })
  );

  return {
    key: destinationKey,
    url: buildR2PublicUrl(destinationKey),
  };
}

export async function listR2ObjectKeys({ prefix }: ListR2ObjectsInput) {
  const config = readR2Config();
  if (!config) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getR2Client(config).send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    response.Contents?.forEach((item) => {
      if (item.Key) keys.push(item.Key);
    });
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}
