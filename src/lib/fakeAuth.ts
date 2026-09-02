// This project is a static, no-backend demo (see README.md "專案定位（重要）").
// "Google SSO" is simulated entirely client-side: logging in just writes a
// canned user object to localStorage — there is no real OAuth redirect, no ID
// token, and no verification of any kind.
import { useCallback, useState } from "react";

const STORAGE_KEY = "gathertime_fake_user";

export interface FakeUser {
  name: string;
  email: string;
}

const DEMO_USER: FakeUser = { name: "王小明", email: "demo.host@gmail.com" };

export function getFakeUser(): FakeUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function fakeLogin(): FakeUser {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
  } catch {}
  return DEMO_USER;
}

export function fakeLogout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// How long the fake "redirecting to Google" popup stays up before the app
// reports the user as logged in — mimics the brief round-trip a real OAuth
// redirect/popup would take.
const LOGIN_TRANSITION_MS = 1100;

export function useFakeAuth() {
  const [user, setUser] = useState<FakeUser | null>(() => getFakeUser());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const login = useCallback(() => {
    setIsAuthenticating(true);
    window.setTimeout(() => {
      setUser(fakeLogin());
      setIsAuthenticating(false);
    }, LOGIN_TRANSITION_MS);
  }, []);

  const logout = useCallback(() => {
    fakeLogout();
    setUser(null);
  }, []);

  return { user, isAuthenticating, login, logout };
}
