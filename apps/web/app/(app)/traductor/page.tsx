"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { callAiTextTool, FunctionsCallError } from "@/lib/firebase/functions";
import { logHistoryEntry } from "@/lib/firebase/history";
import { takeHandoffText } from "@/lib/utils/handoff";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const LANGUAGES = [
  { value: "Español", label: "Español" },
  { value: "Inglés", label: "Inglés" },
  { value: "Francés", label: "Francés" },
  { value: "Alemán", label: "Alemán" },
];

const AUTO = "auto";

const selectClass =
  "h-10 w-full min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 font-sans text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text";

export default function TraductorPage() {
  const { user } = useAuthUser();
  const [source, setSource] = useState(AUTO);
  const [target, setTarget] = useState("Inglés");
  const [text, setText] = useState(() => takeHandoffText() ?? "");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSwap() {
    if (source === AUTO) return;
    setSource(target);
    setTarget(source);
    if (result) {
      setText(result);
      setResult(null);
    }
  }

  async function handleTranslate() {
    if (!text.trim() || !user) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const translated = await callAiTextTool({
        action: "traducir",
        text: text.trim(),
        targetLanguage: target,
        sourceLanguage: source === AUTO ? undefined : source,
      });
      setResult(translated);
      await logHistoryEntry(user.uid, {
        type: "traduccion",
        title: `Traducción a ${target}`,
        detail: translated.slice(0, 300),
      });
    } catch (err) {
      setError(err instanceof FunctionsCallError ? err.message : "Ha ocurrido un problema. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    toast.success("Copiado.");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Traductor</h1>
        <p className="mt-1 font-sans text-text-dim">Traduce texto entre varios idiomas.</p>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <select
            aria-label="Idioma de origen"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={selectClass}
          >
            <option value={AUTO}>Detectar automáticamente</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSwap}
            disabled={source === AUTO}
            aria-label="Intercambiar idiomas"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-text-dim transition-colors hover:bg-surface-2 hover:text-text disabled:pointer-events-none disabled:opacity-40"
          >
            <span aria-hidden="true">⇄</span>
          </button>

          <select
            aria-label="Idioma de destino"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={selectClass}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe o pega el texto a traducir…"
          className="mt-4 w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface-2 p-3.5 font-sans text-[15px] text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
        />

        <div className="mt-4 flex justify-end">
          <Button loading={loading} disabled={!text.trim()} onClick={handleTranslate}>
            Traducir
          </Button>
        </div>
      </Card>

      {error && <p className="font-sans text-sm text-danger">{error}</p>}

      {result && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-lg text-text">Traducción</h2>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              Copiar
            </Button>
          </div>
          <div className="mt-3 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-text">
            {result}
          </div>
        </Card>
      )}
    </div>
  );
}
