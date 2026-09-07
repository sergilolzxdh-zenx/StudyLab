"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useUserProfile } from "@/lib/firebase/userProfile";
import { callAiTextTool, FunctionsCallError, type TextToolAction } from "@/lib/firebase/functions";
import { logHistoryEntry } from "@/lib/firebase/history";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TOOL_NAV_ITEMS } from "@/lib/navigation";
import { PLAN_LABEL } from "@/lib/plans";

const SUMMARIZER_ACTIONS: { action: TextToolAction; label: string; historyTitle: string }[] = [
  { action: "resumir", label: "Resumir", historyTitle: "Resumen generado" },
  { action: "explicar", label: "Explicar fácil", historyTitle: "Explicación generada" },
  { action: "preguntas", label: "Generar preguntas", historyTitle: "Preguntas de repaso generadas" },
  { action: "examen", label: "Crear examen", historyTitle: "Examen generado" },
];

export default function DashboardPage() {
  const { user } = useAuthUser();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user?.uid);
  const firstName = user?.displayName?.split(" ")[0];

  const [summarizerText, setSummarizerText] = useState("");
  const [summarizerResult, setSummarizerResult] = useState<string | null>(null);
  const [summarizerError, setSummarizerError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<TextToolAction | null>(null);

  async function handleSummarizerAction(action: TextToolAction, historyTitle: string) {
    if (!summarizerText.trim() || !user) return;
    setRunningAction(action);
    setSummarizerError(null);
    setSummarizerResult(null);
    try {
      const result = await callAiTextTool({ action, text: summarizerText.trim() });
      setSummarizerResult(result);
      await logHistoryEntry(user.uid, {
        type: "resumen",
        title: historyTitle,
        detail: result.slice(0, 300),
      });
    } catch (error) {
      setSummarizerError(
        error instanceof FunctionsCallError ? error.message : "Ha ocurrido un problema. Inténtalo de nuevo."
      );
    } finally {
      setRunningAction(null);
    }
  }

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
            value={summarizerText}
            onChange={(e) => setSummarizerText(e.target.value)}
            placeholder="Pega aquí tu texto de estudio…"
            className="mt-4 w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface-2 p-3.5 font-sans text-[15px] text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {SUMMARIZER_ACTIONS.map(({ action, label, historyTitle }) => (
              <Button
                key={action}
                variant="secondary"
                size="sm"
                loading={runningAction === action}
                disabled={!summarizerText.trim() || runningAction !== null}
                onClick={() => handleSummarizerAction(action, historyTitle)}
              >
                {label}
              </Button>
            ))}
          </div>

          {summarizerError && (
            <p className="mt-3 font-sans text-sm text-danger">{summarizerError}</p>
          )}

          {summarizerResult && (
            <div className="mt-4 whitespace-pre-wrap rounded-[var(--radius-md)] border border-border bg-surface-2 p-3.5 font-sans text-sm text-text">
              {summarizerResult}
            </div>
          )}
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
              <Link
                href="/plan"
                className="mt-3 inline-block font-sans text-sm text-text underline underline-offset-4"
              >
                Gestionar plan
              </Link>
            </>
          ) : (
            <p className="mt-3 font-sans text-sm text-text-dim">
              Tu perfil todavía no se ha creado en Firestore.
            </p>
          )}

          <p className="mt-4 border-t border-border pt-4 font-sans text-sm text-text-dim">
            El seguimiento de racha, tiempo de estudio y objetivos todavía no
            está construido.
          </p>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-lg text-text">Herramientas</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TOOL_NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ "--stagger-index": i } as React.CSSProperties}
              className="stagger-item rounded-[var(--radius-md)] border border-border bg-surface px-4 py-5 text-center font-sans text-sm text-text transition-[background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-surface-2 active:scale-[0.97]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
