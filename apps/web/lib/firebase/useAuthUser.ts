"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribeToAuthState } from "@/lib/firebase/auth";

interface AuthState {
  user: User | null;
  /** True until the first auth callback fires (or immediately if Firebase isn't configured). */
  loading: boolean;
}

export function useAuthUser(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: isFirebaseConfigured,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = subscribeToAuthState((user) => setState({ user, loading: false }));
    return unsubscribe;
  }, []);

  return state;
}
