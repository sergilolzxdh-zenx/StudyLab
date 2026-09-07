"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

export type ThemeMode = "system" | "light" | "dark";
export type BackgroundMode = "starfield" | "basic";
export type AccentColor = "mono" | "indigo" | "emerald" | "amber" | "rose";

interface Prefs {
  theme: ThemeMode;
  background: BackgroundMode;
  accent: AccentColor;
}

const DEFAULT_PREFS: Prefs = { theme: "system", background: "starfield", accent: "mono" };
export const THEME_STORAGE_KEY = "studylab:prefs";

interface ThemeContextValue extends Prefs {
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  setBackground: (background: BackgroundMode) => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function readSystemDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthUser();

  // Deterministic defaults on first render — the server has no window/
  // localStorage, so if these read real browser values synchronously here,
  // the client's very first (pre-hydration) render would already disagree
  // with the server-rendered HTML, causing a structural hydration mismatch
  // (StarfieldBackgroundLoader mounting/not mounting differently). The real
  // values get applied a moment later, inside the mount effect below. The
  // blocking <Script> in the root layout already paints the correct colors
  // before any of this runs, so there's no visible flash either way.
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [systemDark, setSystemDark] = useState<boolean>(false);
  // Full remote `preferences` map (theme/background/accent plus fields this
  // provider doesn't own, like `language`) so persistRemote can merge
  // without clobbering them — updateDoc replaces the whole field, not a
  // deep merge.
  const remotePreferencesRef = useRef<Record<string, unknown>>({});
  // Guards the persistence effect below: until the real stored prefs have
  // been read (see the microtask), `prefs` is still just DEFAULT_PREFS —
  // writing that to localStorage now would clobber whatever was actually
  // there before this component ever mounted.
  const hydratedRef = useRef(false);

  useEffect(() => {
    // Deferred to a microtask so the setState calls land after this effect
    // (and the hydration pass it belongs to) has committed, not inside the
    // effect body itself.
    queueMicrotask(() => {
      setPrefs(readStoredPrefs());
      setSystemDark(readSystemDark());
      hydratedRef.current = true;
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Live-sync from Firestore: a signed-in user's saved preferences (set on
  // any device) win over whatever's in this browser's localStorage. Kept as
  // a direct subscription (rather than mirroring useUserProfile's already
  // -derived state) so the setState call lives inside the onSnapshot
  // callback, not the effect body itself.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(getDb(), "users", user.uid), (snap) => {
      if (!snap.exists()) return;
      const remote = (snap.data() as { preferences?: Record<string, unknown> }).preferences;
      if (!remote) return;
      remotePreferencesRef.current = remote;
      const remoteTheme = remote.theme as ThemeMode | undefined;
      const remoteBackground = remote.background as BackgroundMode | undefined;
      const remoteAccent = remote.accent as AccentColor | undefined;
      if (!remoteTheme && !remoteBackground && !remoteAccent) return;
      setPrefs((prev) => ({
        theme: remoteTheme ?? prev.theme,
        background: remoteBackground ?? prev.background,
        accent: remoteAccent ?? prev.accent,
      }));
    });
    return unsubscribe;
  }, [user]);

  const resolvedTheme: "light" | "dark" = prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme;

  useEffect(() => {
    // Skip the very first pass, before the mount effect's microtask has
    // read the real stored prefs — prefs is still just DEFAULT_PREFS then,
    // and writing that out would overwrite the real localStorage value
    // (and briefly stomp the theme the blocking init script already
    // applied) before it's ever been read.
    if (!hydratedRef.current) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    if (prefs.accent === "mono") root.removeAttribute("data-accent");
    else root.setAttribute("data-accent", prefs.accent);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // best-effort only
    }
  }, [prefs, resolvedTheme]);

  const persistRemote = useCallback(
    (patch: Partial<Prefs>) => {
      if (!user) return;
      // Merge optimistically into the ref too, so rapid successive changes
      // (e.g. theme then accent, before either write round-trips) build on
      // each other instead of the second call overwriting the first with
      // stale server state.
      const next = { ...remotePreferencesRef.current, ...patch };
      remotePreferencesRef.current = next;
      updateDoc(doc(getDb(), "users", user.uid), { preferences: next }).catch(() => {
        // Non-critical: the setting is already applied locally and saved to
        // localStorage — a failed Firestore sync just means it won't follow
        // this user to another device yet.
      });
    },
    [user]
  );

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      setPrefs((p) => ({ ...p, theme }));
      persistRemote({ theme });
    },
    [persistRemote]
  );

  const setBackground = useCallback(
    (background: BackgroundMode) => {
      setPrefs((p) => ({ ...p, background }));
      persistRemote({ background });
    },
    [persistRemote]
  );

  const setAccent = useCallback(
    (accent: AccentColor) => {
      setPrefs((p) => ({ ...p, accent }));
      persistRemote({ accent });
    },
    [persistRemote]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ ...prefs, resolvedTheme, setTheme, setBackground, setAccent }),
    [prefs, resolvedTheme, setTheme, setBackground, setAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider.");
  return ctx;
}
