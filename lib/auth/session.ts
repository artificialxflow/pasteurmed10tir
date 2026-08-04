import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const PATIENT_SESSION_COOKIE = 'pasteur_patient_session';
export const ADMIN_SESSION_COOKIE = 'pasteur_admin_session';

const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export type PatientSessionPayload = {
  userId: string;
  phone: string;
};

export type AdminSessionPayload = {
  adminUserId: string;
};

function sessionSecret(): string {
  return process.env.SESSION_SECRET || 'pasteur-dev-insecure-secret';
}

function sign(data: string): string {
  return createHmac('sha256', sessionSecret()).update(data).digest('hex');
}

export function encodeSession(payload: object): string {
  const json = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${json}.${sign(json)}`;
}

export function decodeSession<T>(token: string): T | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const json = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(json);
  try {
    if (
      expected.length !== sig.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    ) {
      return null;
    }
    return JSON.parse(Buffer.from(json, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export async function setPatientSession(payload: PatientSessionPayload): Promise<void> {
  const jar = await cookies();
  jar.set(PATIENT_SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearPatientSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(PATIENT_SESSION_COOKIE);
}

export async function getPatientSession(): Promise<PatientSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(PATIENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession<PatientSessionPayload>(token);
}

export async function setAdminSession(payload: AdminSessionPayload): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession<AdminSessionPayload>(token);
}
