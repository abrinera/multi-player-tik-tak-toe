// Guest session token management. The private token stays in localStorage;
// only its SHA-256 hash is stored server-side.

const KEY_PREFIX = "ttt.session.";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateSessionToken(roomToken: string): string {
  const key = KEY_PREFIX + roomToken;
  let t = localStorage.getItem(key);
  if (!t || t.length < 32) {
    t = generateToken();
    localStorage.setItem(key, t);
  }
  return t;
}

export function setSessionToken(roomToken: string, token: string) {
  localStorage.setItem(KEY_PREFIX + roomToken, token);
}

export function clearSessionToken(roomToken: string) {
  localStorage.removeItem(KEY_PREFIX + roomToken);
}

export function getStoredSessionId(roomToken: string): string | null {
  return localStorage.getItem(KEY_PREFIX + roomToken + ".id");
}
export function setStoredSessionId(roomToken: string, sessionId: string) {
  localStorage.setItem(KEY_PREFIX + roomToken + ".id", sessionId);
}
export function clearStoredSessionId(roomToken: string) {
  localStorage.removeItem(KEY_PREFIX + roomToken + ".id");
}

export function newClientActionId(): string {
  return crypto.randomUUID();
}
