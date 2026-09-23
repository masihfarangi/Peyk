import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const SESSION_KEY = 'peyk.auth.session';
const USERS_KEY = 'peyk.auth.users';

/** A registered user, as the signup form collects them. */
export interface StoredUser {
  name: string;
  nationalId: string;
  /** Local part only — no +98, no leading 0. See pages/Auth/validation.ts. */
  phone: string;
}

interface Session {
  phone: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  session: Session | null;
  /** Writes a new user to the mock "database". Rejects a duplicate national ID. */
  register: (user: StoredUser) => { ok: true } | { ok: false; error: string };
  /** Starts an authenticated session for this phone number. */
  login: (phone: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function readUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

/**
 * A mock auth layer, matching what the standalone login/register prototype
 * did: "registering" writes to localStorage, and "logging in" accepts a
 * fixed demo one-time code (see AuthPage). Swap the bodies of register/login
 * for real API calls once a backend exists — every consumer (AuthPage, App)
 * only ever sees this context, never localStorage directly, so that's the
 * only place that needs to change.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const register = useCallback((user: StoredUser) => {
    const users = readUsers();
    if (users.some((existing) => existing.nationalId === user.nationalId)) {
      return { ok: false as const, error: 'این کد ملی قبلاً ثبت‌نام کرده است' };
    }
    users.push(user);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { ok: true as const };
  }, []);

  const login = useCallback((phone: string) => {
    const next: Session = { phone };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: session !== null, session, register, login, logout }),
    [session, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
