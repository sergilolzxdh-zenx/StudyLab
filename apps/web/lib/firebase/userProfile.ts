"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "@/lib/firebase/firestore";
import { PLAN_POWERMONEY, type Plan } from "@/lib/plans";

export const FREE_PLAN_POWERMONEY = PLAN_POWERMONEY.free;

export type { Plan };

export interface UserProfile {
  name: string;
  email: string;
  plan: Plan;
  powermoney: number;
  powermoneyResetAt: Timestamp | null;
  preferences: { language: string; theme: string };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/**
 * Creates the user's Firestore profile the first time they authenticate.
 * Never overwrites an existing profile, and never sets anything but the
 * fixed free-tier defaults — see firestore.rules, which enforces the same
 * constraint server-side.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const db = getDb();
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    name: user.displayName ?? "",
    email: user.email ?? "",
    plan: "free",
    powermoney: FREE_PLAN_POWERMONEY,
    powermoneyResetAt: serverTimestamp(),
    preferences: { language: "es", theme: "system" },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

interface UseUserProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useUserProfile(uid: string | undefined): UseUserProfileState {
  const [state, setState] = useState<UseUserProfileState>({
    profile: null,
    loading: !!uid,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;
    const db = getDb();
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setState({
          profile: snap.exists() ? (snap.data() as UserProfile) : null,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({ profile: null, loading: false, error: err.message });
      }
    );
    return unsubscribe;
  }, [uid]);

  return uid ? state : { profile: null, loading: false, error: null };
}
