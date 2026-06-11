const SESSION_KEY = "eddo-assess-hub-session";

export interface AuthUser {
  email: string;
  displayName: string;
}

export interface AuthSession {
  user: AuthUser;
  signedInAt: string;
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

/** Prototype sign-in until WorkOS AuthKit is wired. */
export function createPrototypeSession(email: string, displayName: string): AuthSession {
  return {
    user: { email, displayName },
    signedInAt: new Date().toISOString(),
  };
}
