"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { callAiOcr, FunctionsCallError } from "@/lib/firebase/functions";
import { logHistoryEntry } from "@/lib/firebase/history";
import { setHandoffText } from "@/lib/utils/handoff";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const SEND_TARGETS = [
  { href: "/resumidor", label: "Resumidor" },
  { href: "/corrector", label: "Corrector" },
  { href: "/traductor", label: "Traductor" },
];

export default function ImagenesPage() {
  const { user } = useAuthUser();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(selected: File | null) {
    setResult(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Formato no soportado. Usa PNG, JPEG o WEBP.");
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("La imagen es demasiado grande (máximo 4 MB).");
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleExtract() {
    if (!file || !user) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const extracted = await callAiOcr(file);
      if (!extracted) {
        setError("No se ha encontrado texto legible en esta imagen.");
      } else {
        setResult(extracted);
        await logHistoryEntry(user.uid, {
          type: "ocr",
          title: "Texto extraído de una imagen",
          detail: extracted.slice(0, 300),
        });
      }
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

  function handleSendTo(href: string) {
    if (!result) return;
    setHandoffText(result);
    router.push(href);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Imágenes</h1>
        <p className="mt-1 font-sans text-text-dim">
          Sube una imagen y extrae el texto que contiene.
        </p>
      </div>

      <Card>
        <FileDropInput onChange={handleFileChange} />

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Vista previa de la imagen seleccionada"
            className="mt-4 max-h-72 w-full rounded-[var(--radius-md)] border border-border object-contain"
          />
        )}

        <div className="mt-4 flex justify-end">
          <Button loading={loading} disabled={!file} onClick={handleExtract}>
            Extraer texto
          </Button>
        </div>
      </Card>

      {error && <p className="font-sans text-sm text-danger">{error}</p>}

      {result && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-lg text-text">Texto extraído</h2>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              Copiar
            </Button>
          </div>
          <div className="mt-3 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-text">
            {result}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="font-sans text-sm text-text-dim">Enviar a:</span>
            {SEND_TARGETS.map((target) => (
              <Button key={target.href} variant="secondary" size="sm" onClick={() => handleSendTo(target.href)}>
                {target.label}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FileDropInput({ onChange }: { onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Seleccionar imagen"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full font-sans text-sm text-text-dim file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-surface-2 file:px-3.5 file:py-2 file:font-sans file:text-sm file:text-text hover:file:bg-border"
      />
      <p className="mt-2 font-sans text-xs text-text-dim">PNG, JPEG o WEBP — máximo 4 MB.</p>
    </div>
  );
}
