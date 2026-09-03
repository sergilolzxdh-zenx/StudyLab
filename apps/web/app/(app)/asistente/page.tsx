"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { callAiChat, FunctionsCallError } from "@/lib/firebase/functions";
import { logHistoryEntry } from "@/lib/firebase/history";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AsistentePage() {
  const { user } = useAuthUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || !user || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await callAiChat(nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      await logHistoryEntry(user.uid, {
        type: "conversacion",
        title: question.slice(0, 80),
        detail: reply.slice(0, 300),
      });
    } catch (err) {
      setError(err instanceof FunctionsCallError ? err.message : "Ha ocurrido un problema. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(content: string) {
    await navigator.clipboard.writeText(content);
    toast.success("Copiado.");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Asistente IA</h1>
        <p className="mt-1 font-sans text-text-dim">
          Pregunta lo que necesites: explicaciones, dudas, preguntas de repaso, exámenes.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {messages.length === 0 ? (
          <p className="font-sans text-sm text-text-dim">Todavía no has preguntado nada.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message, index) => (
              <li
                key={index}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-[var(--radius-md)] px-4 py-3 font-sans text-[15px] leading-relaxed",
                    message.role === "user"
                      ? "bg-accent text-accent-contrast"
                      : "border border-border bg-surface text-text"
                  )}
                >
                  {message.content}
                  {message.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(message.content)}
                      className="mt-2 block font-sans text-xs text-text-dim hover:text-text"
                    >
                      Copiar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-text-dim">
            <Spinner />
            <span className="font-sans text-sm">Pensando…</span>
          </div>
        )}

        {error && <p className="font-sans text-sm text-danger">{error}</p>}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          aria-label="Escribe tu pregunta"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="h-11 flex-1 rounded-[var(--radius-md)] border border-border bg-surface-2 px-3.5 font-sans text-[15px] text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text"
        />
        <Button type="submit" loading={loading} disabled={!input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
