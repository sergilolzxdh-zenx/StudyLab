"use client";

import Link from "next/link";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useUserProfile } from "@/lib/firebase/userProfile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TOOL_NAV_ITEMS } from "@/lib/navigation";

const PLAN_LABEL: Record<string, string> = { free: "Free", pro: "Pro", premium: "Premium" };

export default function DashboardPage() {
  const { user } = useAuthUser();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user?.uid);
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">
          {firstName ? `Hola, ${firstName}` : "Hola de nuevo"}
        </h1>
        <p className="mt-1 font-sans text-text-dim">¿Qué quieres estudiar hoy?</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <h2 className="font-display text-lg text-text">Resumidor rápido</h2>
          <p className="mt-1 font-sans text-sm text-text-dim">
            Pega un texto y StudyLab lo resume, lo explica o genera preguntas.
          </p>
          <textarea
            rows={6}
            placeholder="Pega aquí tu texto de estudio…"
            className="mt-4 w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface-2 p-3.5 font-sans text-[15px] text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
          />
          <p className="mt-3 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3.5 py-3 font-sans text-sm text-text">
            Esta herramienta necesita Gemini conectado en el backend (Fase 18)
            — todavía no está activa.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled variant="secondary" size="sm">
              Resumir
            </Button>
            <Button disabled variant="secondary" size="sm">
              Explicar fácil
            </Button>
            <Button disabled variant="secondary" size="sm">
              Generar preguntas
            </Button>
            <Button disabled variant="secondary" size="sm">
              Crear examen
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg text-text">Tu plan</h2>

          {profileLoading ? (
            <div className="mt-4 flex items-center gap-2 text-text-dim">
              <Spinner />
              <span className="font-sans text-sm">Cargando…</span>
            </div>
          ) : profileError ? (
            <p className="mt-3 font-sans text-sm text-danger">
              No se ha podido cargar tu plan. Comprueba que Firestore esté
              creado y que las reglas de seguridad estén publicadas.
            </p>
          ) : profile ? (
            <>
              <p className="mt-3 font-display text-2xl text-text">
                {PLAN_LABEL[profile.plan] ?? profile.plan}
              </p>
              <p className="mt-1 font-sans text-sm text-text-dim">
                {profile.plan === "premium"
                  ? "Uso ilimitado de herramientas."
                  : `${profile.powermoney} usos disponibles.`}
              </p>
            </>
          ) : (
            <p className="mt-3 font-sans text-sm text-text-dim">
              Tu perfil todavía no se ha creado en Firestore.
            </p>
          )}

          <p className="mt-4 border-t border-border pt-4 font-sans text-sm text-text-dim">
            El seguimiento de racha, tiempo de estudio y objetivos llega
            cuando el cuaderno y el calendario empiecen a escribir en
            Firestore (Fase 5–6).
          </p>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-lg text-text">Herramientas</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TOOL_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-5 text-center font-sans text-sm text-text transition-colors hover:bg-surface-2"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
