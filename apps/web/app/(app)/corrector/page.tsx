"use client";

import { useState } from "react";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { callAiTextTool, FunctionsCallError } from "@/lib/firebase/functions";
import { logHistoryEntry } from "@/lib/firebase/history";
import { takeHandoffText } from "@/lib/utils/handoff";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CorrectorPage() {
  const { user } = useAuthUser();
  const [text, setText] = useState(() => takeHandoffText() ?? "");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCorrect() {
    if (!text.trim() || !user) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const corrected = await callAiTextTool({ action: "corregir", text: text.trim() });
      setResult(corrected);
      await logHistoryEntry(user.uid, {
        type: "correccion",
        title: "Corrección de texto",
        detail: corrected.slice(0, 300),
      });
    } catch (err) {
      setError(err instanceof FunctionsCallError ? err.message : "Ha ocurrido un problema. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Corrector</h1>
        <p className="mt-1 font-sans text-text-dim">
          Ortografía, gramática, puntuación, claridad y estilo.
        </p>
      </div>

      <Card>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega aquí el texto que quieres corregir…"
          className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface-2 p-3.5 font-sans text-[15px] text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
        />
        <div className="mt-4 flex justify-end">
          <Button loading={loading} disabled={!text.trim()} onClick={handleCorrect}>
            Corregir
          </Button>
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
