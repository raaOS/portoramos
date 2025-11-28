import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { sign, verify } from 'jsonwebtoken';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD_SCRYPT = process.env.ADMIN_PASSWORD_SCRYPT;
const PASSWORD_SALT = process.env.PASSWORD_SALT;
const JWT_SECRET = process.env.JWT_SECRET;

function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function hashPasswordScrypt(password: string, salt: string): string {
  const key = crypto.scryptSync(password, salt, 64);
  return key.toString('hex');
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export const verifyAdminPassword = (password: string): boolean => {
  if (ADMIN_PASSWORD_SCRYPT && PASSWORD_SALT) {
    const hashedInput = hashPasswordScrypt(password, PASSWORD_SALT);
    return timingSafeEqualString(hashedInput, ADMIN_PASSWORD_SCRYPT);
  }

  if (ADMIN_PASSWORD_HASH && PASSWORD_SALT) {
    const hashedInput = hashPassword(password, PASSWORD_SALT);
    return timingSafeEqualString(hashedInput, ADMIN_PASSWORD_HASH);
  }

  if (ADMIN_PASSWORD) {
    return timingSafeEqualString(password, ADMIN_PASSWORD);
  }

  console.error('Admin password is not configured. Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH/PASSWORD_SALT.');
  return false;
};

export const getAdminToken = (): string => {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured. Cannot issue admin token.');
    throw new Error('Server configuration error');
  }

  return sign(
    { sub: 'admin', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const verifyAdminToken = (token: string): boolean => {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured. Cannot verify admin token.');
    return false;
  }

  try {
    const payload = verify(token, JWT_SECRET);
    if (typeof payload === 'object' && payload !== null && 'sub' in payload) {
      return (payload as { sub?: string }).sub === 'admin';
    }
    return false;
  } catch {
    return false;
  }
};

export const checkAdminAuth = (request: NextRequest): boolean => {
  const authHeader = request.headers.get('authorization');
  const cookieToken =
    request.cookies.get('admin_token')?.value ||
    request.cookies.get('admin-token')?.value;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyAdminToken(token);
  }

  if (cookieToken) {
    return verifyAdminToken(cookieToken);
  }

  return false;
};
