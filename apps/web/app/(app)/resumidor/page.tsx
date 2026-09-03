"use client";

import { useState } from "react";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { callAiTextTool, FunctionsCallError, type TextToolAction } from "@/lib/firebase/functions";
import { logHistoryEntry } from "@/lib/firebase/history";
import { takeHandoffText } from "@/lib/utils/handoff";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ACTIONS: { action: TextToolAction; label: string; historyTitle: string }[] = [
  { action: "resumir", label: "Resumir", historyTitle: "Resumen generado" },
  { action: "explicar", label: "Explicar fácil", historyTitle: "Explicación generada" },
  { action: "preguntas", label: "Generar preguntas", historyTitle: "Preguntas de repaso generadas" },
  { action: "examen", label: "Crear examen", historyTitle: "Examen generado" },
];

export default function ResumidorPage() {
  const { user } = useAuthUser();
  const [text, setText] = useState(() => takeHandoffText() ?? "");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<TextToolAction | null>(null);

  async function handleAction(action: TextToolAction, historyTitle: string) {
    if (!text.trim() || !user) return;
    setRunningAction(action);
    setError(null);
    setResult(null);
    try {
      const generated = await callAiTextTool({ action, text: text.trim() });
      setResult(generated);
      await logHistoryEntry(user.uid, {
        type: "resumen",
        title: historyTitle,
        detail: generated.slice(0, 300),
      });
    } catch (err) {
      setError(err instanceof FunctionsCallError ? err.message : "Ha ocurrido un problema. Inténtalo de nuevo.");
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Resumidor</h1>
        <p className="mt-1 font-sans text-text-dim">
          Pega un texto y resúmelo, explícalo fácil, o genera preguntas y exámenes.
        </p>
      </div>

      <Card>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega aquí tu texto de estudio…"
          className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface-2 p-3.5 font-sans text-[15px] text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {ACTIONS.map(({ action, label, historyTitle }) => (
            <Button
              key={action}
              variant="secondary"
              loading={runningAction === action}
              disabled={!text.trim() || runningAction !== null}
              onClick={() => handleAction(action, historyTitle)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {error && <p className="font-sans text-sm text-danger">{error}</p>}

      {result && (
        <Card>
          <h2 className="font-display text-lg text-text">Resultado</h2>
          <div className="mt-3 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-text">
            {result}
          </div>
        </Card>
      )}
    </div>
  );
}
