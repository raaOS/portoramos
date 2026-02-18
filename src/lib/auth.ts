import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { sign, verify } from 'jsonwebtoken';

// Clean auth system - scrypt only (most secure)
const ADMIN_PASSWORD_SCRYPT = process.env.ADMIN_PASSWORD_SCRYPT;
const PASSWORD_SALT = process.env.PASSWORD_SALT;
const JWT_SECRET = process.env.JWT_SECRET;

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
  if (!ADMIN_PASSWORD_SCRYPT || !PASSWORD_SALT) {
    throw new Error('Admin password security not configured - please set ADMIN_PASSWORD_SCRYPT and PASSWORD_SALT in your environment variables');
  }

  if (!password || password.length < 8) {
    return false;
  }

  const hashedInput = hashPasswordScrypt(password, PASSWORD_SALT);
  return timingSafeEqualString(hashedInput, ADMIN_PASSWORD_SCRYPT);
};

export const getAdminToken = (): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return sign(
    { sub: 'admin', role: 'admin', iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    {
      expiresIn: '2h',
      issuer: 'portfolio-admin',
      audience: 'admin-panel'
    }
  );
};

export const verifyAdminToken = (token: string): boolean => {
  if (!JWT_SECRET) {
    return false;
  }

  try {
    const payload = verify(token, JWT_SECRET, {
      issuer: 'portfolio-admin',
      audience: 'admin-panel'
    });

    if (typeof payload === 'object' && payload !== null && 'sub' in payload) {
      return (payload as { sub?: string }).sub === 'admin';
    }
    return false;
  } catch {
    return false;
  }
};

export const checkAdminAuth = (request: NextRequest): boolean => {
  try {
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
  } catch {
    return false;
  }
};