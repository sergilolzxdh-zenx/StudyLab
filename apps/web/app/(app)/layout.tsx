"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/Spinner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (!isFirebaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-sm font-sans text-sm text-text-dim">
          Firebase no está configurado, así que no se puede comprobar tu sesión.
        </p>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-text-dim" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
