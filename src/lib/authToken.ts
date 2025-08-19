// src/lib/authToken.ts
const KEY = 'authToken';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(KEY) || null;
}
export function setToken(t: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, t);
}
export function clearToken() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

// helper to read payload for UI role logic (no verification)
export function readTokenPayload(): any | null {
  try {
    const t = getToken();
    if (!t) return null;
    const [, payload] = t.split('.');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
